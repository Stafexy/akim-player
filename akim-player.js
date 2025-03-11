// === Константы (переносим в параметры конфигурации) ===
// const song = 'track1'; // Уберем, будет передаваться как параметр
const skipTime = 30;

// === Настройка отладки ===
const DEBUG_MODE = true; // Установите в true для включения отладки

// === Шаги громкости ===
const volumeLevels = [0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30, 35, 40, 45, 50, 60, 70, 80, 90, 100];

// === Функции ===
const debugLog = (message) => {if (DEBUG_MODE) {console.log(message);}};

const formatTime = (seconds) => {
	const minutes = Math.floor(seconds / 60);
	const remainingSeconds = Math.floor(seconds % 60);
	const formattedMinutes = String(minutes).padStart(2, '0');
	const formattedSeconds = String(remainingSeconds).padStart(2, '0');
	return `${formattedMinutes}:${formattedSeconds}`;
};

// Функция создания плеера (принимает конфигурацию)
const createAkimPlayer = (config) => {
    const { containerId, song, initialVolume = 0.5, autoplay = false } = config; // Параметры конфигурации
    if (!containerId || !song) {
        if (DEBUG_MODE) { console.error("Необходимы параметры: containerId и song"); }
        return null; // Прерываем выполнение, если нет необходимых параметров
    }

    // === Создание DOM элементов (динамически) ===
    const akimContainer = document.createElement('div');
    akimContainer.classList.add('akim');

    const akimPlayer = document.createElement('div');
    akimPlayer.classList.add('akimPlayer');

    const audio = document.createElement('audio');
    audio.classList.add('audio');
    audio.src = `audio/${song}.mp3`;
    audio.volume = initialVolume; // Устанавливаем начальную громкость

    const tbuttons = document.createElement('div');
    tbuttons.classList.add('tbuttons');

    const prevBtn = document.createElement('div');
    prevBtn.classList.add('btn', 'prev', 'pointer', 'border');
    prevBtn.innerHTML = '<img src="" alt="prevBtn">';

    const playBtn = document.createElement('div');
    playBtn.classList.add('btn', 'play', 'pointer', 'border');
    playBtn.innerHTML = '<img src="" alt="play/pause" class="img__play">';

    const nextBtn = document.createElement('div');
    nextBtn.classList.add('btn', 'next', 'pointer', 'border');
    nextBtn.innerHTML = '<img src="" alt="nextBtn">';

    const progCont = document.createElement('div');
    progCont.classList.add('progControl', 'pointer', 'border');
    const progress = document.createElement('div');
    progress.classList.add('tprogress');
    progCont.appendChild(progress);

    const RPanel = document.createElement('div');
    RPanel.classList.add('RPanel');

    const speedControl = document.createElement('div');
    speedControl.classList.add('speedControl', 'pointer', 'border', 'btn');
    const speedBtn = document.createElement('div');
    speedBtn.classList.add('speedBtn');
    speedBtn.textContent = 'x1';
    speedControl.appendChild(speedBtn);

    const timeAudio = document.createElement('div');
    timeAudio.classList.add('timeAudio', 'pointer', 'border', 'btn');
    timeAudio.textContent = '00:00/00:00';

    const tVol = document.createElement('div');
    tVol.classList.add('tVol', 'pointer', 'border', 'btn');

    const volBtn = document.createElement('div');
    volBtn.classList.add('btn', 'volBtn');
    volBtn.innerHTML = '<img src="" alt="volControl" class="img__src">';

    const volControl = document.createElement('div');
    volControl.classList.add('volControl');
    const volReg = document.createElement('div');
    volReg.classList.add('volReg');
    volControl.appendChild(volReg);

    tVol.appendChild(volBtn);
    tVol.appendChild(volControl);

    // === Сборка DOM элементов ===
    tbuttons.appendChild(prevBtn);
    tbuttons.appendChild(playBtn);
    tbuttons.appendChild(nextBtn);

    RPanel.appendChild(speedControl);
    RPanel.appendChild(timeAudio);
    RPanel.appendChild(tVol);

    akimPlayer.appendChild(audio);
    akimPlayer.appendChild(tbuttons);
    akimPlayer.appendChild(progCont);
    akimPlayer.appendChild(RPanel);

    akimContainer.appendChild(akimPlayer);

    // === Переменные состояния (локальные для каждого плеера) ===
    let isTimeRemaining = false;
    let previousVolume = initialVolume;
    let isMuted = false;
    let currentSpeedIndex = 0;
    const playbackSpeeds = [1.00, 1.25, 1.50, 1.75, 2.00];
    let isDragging = false;

    // === Функции (локальные для каждого плеера) ===

    const formatTime = (seconds) => {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = Math.floor(seconds % 60);
        const formattedMinutes = String(minutes).padStart(2, '0');
        const formattedSeconds = String(remainingSeconds).padStart(2, '0');
        return `${formattedMinutes}:${formattedSeconds}`;
    };

    const playSong = () => {
        if (audio.src === "") { if (DEBUG_MODE) { console.error("Не указан источник аудио!"); } return; }
        player.classList.add('play'); // Используем переменную player, определенную ниже
        playBtn.querySelector('.img__play').src = 'ico/pause.svg';
        audio.play().then(() => { debugLog("Начало воспроизведения"); }).catch(error => { if (DEBUG_MODE) { console.error("Ошибка воспроизведения:", error); } });
    };

    const pauseSong = () => {
        player.classList.remove('play'); // Используем переменную player, определенную ниже
        playBtn.querySelector('.img__play').src = 'ico/play.svg';
        audio.pause();
        debugLog("Пауза воспроизведения");
    };

    const skipForward = () => {
        audio.currentTime = Math.min(audio.currentTime + skipTime, audio.duration);
        debugLog(`Перемотка вперед на ${skipTime} секунд`);
    };

    const skipBackward = () => {
        audio.currentTime = Math.max(audio.currentTime - skipTime, 0);
        debugLog(`Перемотка назад на ${skipTime} секунд`);
    };

    const updateProgress = (e) => {
        const { duration, currentTime } = e.target;
        if (isNaN(duration) || duration <= 0) { progress.style.width = '0%'; return; }
        const progressPercent = (currentTime / duration) * 100;
        progress.style.width = `${progressPercent}%`;
        const timeDisplay = isTimeRemaining ? `-${formatTime(duration - currentTime)}/${formatTime(duration)}` : `${formatTime(currentTime)}/${formatTime(duration)}`;
        timeAudio.textContent = timeDisplay;
    };

    const setProgress = (e) => {
        const width = progCont.clientWidth;
        const clickX = e.offsetX;
        const duration = audio.duration;
        if (isNaN(duration)) return;
        audio.currentTime = (clickX / width) * duration;
    };

    const toggleMute = () => {
        isMuted = !isMuted;
        if (isMuted) { previousVolume = audio.volume; audio.volume = 0; } else { audio.volume = previousVolume === 0 ? 0.02 : previousVolume; }
        updateVolumeIcon();
        updateVolumeUI();
    };

    const updateVolumeIcon = () => {
        volBtn.querySelector('img').src = (audio.volume === 0 || isMuted) ? 'ico/volX.svg' : 'ico/vol.svg';
    };

    const setVolumeToNearestLevel = (volume) => {
        let nearestVolume = volumeLevels.reduce((prev, curr) => Math.abs(curr / 100 - volume) < Math.abs(prev / 100 - volume) ? curr : prev, 0) / 100;
        audio.volume = nearestVolume;
        updateVolumeUI();
        return nearestVolume * 100;
    };

    const getVolumeFromEvent = (e) => {
        let volume = e.offsetX / volControl.clientWidth;
        return Math.max(0, Math.min(1, volume));
    };

    const updateVolumeUI = () => {
        const volumePercent = audio.volume * 100;
        volReg.style.width = `${volumePercent}%`;
        updateVolumeIcon();
    };

    const handleVolumeClick = (e) => {
        let volume = getVolumeFromEvent(e);
        previousVolume = volume;
        setVolumeToNearestLevel(volume);
    };

    const handleVolumeMouseDown = (e) => {
        isDragging = true;
        handleVolumeClick(e);
    };

    const handleVolumeMouseMove = (e) => {
        if (!isDragging) return;
        handleVolumeClick(e);
    };

    const handleVolumeMouseUp = () => { isDragging = false; };
    const handleVolumeMouseLeave = () => { isDragging = false; };

    const handleKeyDown = (event) => {
        let currentVolume = audio.volume;
        let currentVolumePercent = currentVolume * 100;

        switch (event.key) {
            case 'ArrowRight':
                skipForward();
                break;
            case 'ArrowLeft':
                skipBackward();
                break;
            case ' ': // Space
                event.preventDefault();
                player.classList.contains('play') ? pauseSong() : playSong();
                break;
            case '+':
            case '=':
                setVolumeToNearestLevel(volumeLevels.find(level => level > currentVolumePercent) / 100 || 1);
                break;
            case '-':
                setVolumeToNearestLevel([...volumeLevels].reverse().find(level => level < currentVolumePercent) / 100 || 0);
                break;
        }
    };

    const toggleTimeRemaining = () => { isTimeRemaining = !isTimeRemaining; };
    const updateSpeedButtonText = () => { speedBtn.textContent = `x${playbackSpeeds[currentSpeedIndex]}`; };
    const setPlaybackSpeed = (speed) => { audio.playbackRate = speed; speedBtn.textContent = `x${speed}` }

    const nextPlaybackSpeed = () => {
        currentSpeedIndex = (currentSpeedIndex + 1) % playbackSpeeds.length;
        const newSpeed = playbackSpeeds[currentSpeedIndex];
        setPlaybackSpeed(newSpeed);
        updateSpeedButtonText();
    }

    // === Обработчики событий (локальные для каждого плеера) ===
    const player = akimPlayer; //  Переопределяем player внутри функции

    playBtn.addEventListener('click', () => player.classList.contains('play') ? pauseSong() : playSong());
    nextBtn.addEventListener('click', skipForward);
    prevBtn.addEventListener('click', skipBackward);
    audio.addEventListener('ended', pauseSong);
    audio.addEventListener('timeupdate', updateProgress);
    progCont.addEventListener('click', setProgress);
    timeAudio.addEventListener('click', toggleTimeRemaining);
    document.addEventListener('keydown', handleKeyDown);

    if (volControl) {
        volControl.addEventListener('mousedown', handleVolumeMouseDown);
        volControl.addEventListener('mousemove', handleVolumeMouseMove);
        volControl.addEventListener('mouseup', handleVolumeMouseUp);
        volControl.addEventListener('mouseleave', handleVolumeMouseLeave);
    } else { if (DEBUG_MODE) { console.error('Элемент volControl не найден!'); } }

    if (volBtn) { volBtn.addEventListener('click', (e) => { e.stopPropagation(); toggleMute(); }); } else { if (DEBUG_MODE) { console.error('Элемент volBtn не найден!'); } }
    if (speedBtn) { speedBtn.addEventListener('click', nextPlaybackSpeed); } else { if (DEBUG_MODE) { console.error('Элемент speedBtn не найден!'); } }


    // === Инициализация (локальная для каждого плеера) ===
    // loadSong(song); // Загрузка песни перенесена в создание элемента audio
    updateVolumeIcon();
    updateSpeedButtonText(); // Устанавливаем начальный текст кнопки скорости.
    if (autoplay) {
        audio.addEventListener('canplay', playSong); // Запускаем воспроизведение после загрузки метаданных
    }

    // Добавляем плеер в указанный контейнер
    const container = document.getElementById(containerId);
    if (container) {
        container.appendChild(akimContainer);
        return akimContainer; // Возвращаем созданный элемент плеера
    } else {
        if (DEBUG_MODE) { console.error(`Контейнер с id "${containerId}" не найден`); }
        return null; // Возвращаем null, если контейнер не найден
    }
};

// Глобальная функция инициализации плееров
window.initAkimPlayers = () => {
    // Получаем все элементы, которые должны стать контейнерами для плееров
    const playerContainers = document.querySelectorAll('.akim-player-container');

    // Перебираем все найденные контейнеры
    playerContainers.forEach(container => {
        // Получаем данные для конфигурации из data-атрибутов контейнера
        const song = container.dataset.song;
        const initialVolume = parseFloat(container.dataset.initialVolume) || 0.5;
        const autoplay = container.dataset.autoplay === 'true';
        const containerId = container.id; // Используем ID контейнера

        // Проверяем, что все необходимые data-атрибуты установлены
        if (!song) {console.error("Необходимо указать data-song атрибут для контейнера", container);return;}
        if (!containerId) {console.error("Необходимо указать id для контейнера", container);return;}

        // Создаем плеер
        createAkimPlayer({containerId: containerId, song: song, initialVolume: initialVolume, autoplay: autoplay});
    });
};

// Автоматическая инициализация после загрузки страницы
document.addEventListener('DOMContentLoaded', () => {window.initAkimPlayers();});