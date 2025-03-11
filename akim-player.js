const createAkimPlayer = (config) => {
    const { containerId, song, initialVolume = 0.5, autoplay = false, mainColor = '#FF834D' } = config; // Параметры конфигурации
    if (!containerId || !song) {
        if (DEBUG_MODE) { console.error("Необходимы параметры: containerId и song"); }
        return null; // Прерываем выполнение, если нет необходимых параметров
    }

    const replaceColor = (svg) => {
        return svg.replaceAll('#FF834D', mainColor);
    };

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
    prevBtn.innerHTML = replaceColor(`<svg width="60" height="60" viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M10 30L30 55V43L19.5 30L30 17V5L10 30Z" fill="#FF834D"/><path d="M30 30L50 55V43L39.5 30L50 17V5L30 30Z" fill="#FF834D"/></svg>`);

    const playBtn = document.createElement('div');
    playBtn.classList.add('btn', 'play', 'pointer', 'border');
    playBtn.innerHTML = replaceColor(`<svg width="60" height="60" viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M50 30L10 55V5L50 30Z" fill="#FF834D"/></svg>`);

    const nextBtn = document.createElement('div');
    nextBtn.classList.add('btn', 'next', 'pointer', 'border');
    nextBtn.innerHTML = replaceColor(`<svg width="60" height="60" viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M50 30L30 55V43L40.5 30L30 17V5L50 30Z" fill="#FF834D"/><path d="M30 30L10 55V43L20.5 30L10 17V5L30 30Z" fill="#FF834D"/></svg>`);

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
    volBtn.innerHTML = replaceColor(`<svg width="60" height="60" viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M27.7778 19.2857H10V40.7143H27.7778L50 55V5L27.7778 19.2857Z" fill="#FF834D"/></svg>`);

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
        playBtn.querySelector('svg').src = replaceColor(`<svg width="60" height="60" viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M50 30L10 55V5L50 30Z" fill="#FF834D"/></svg>`);
        audio.play().then(() => { debugLog("Начало воспроизведения"); }).catch(error => { if (DEBUG_MODE) { console.error("Ошибка воспроизведения:", error); } });
    };

    const pauseSong = () => {
        player.classList.remove('play'); // Используем переменную player, определенную ниже
        playBtn.querySelector('svg').src = replaceColor(`<svg width="60" height="60" viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M50 30L10 55V5L50 30Z" fill="#FF834D"/></svg>`);
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
        volBtn.querySelector('svg').src = (audio.volume === 0 || isMuted) ? replaceColor(`<svg width="60" height="60" viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M27.7778 19.2857H10V40.7143H27.7778L50 55V5L27.7778 19.2857Z" fill="#E6E6E6"/><path d="M10 5L50 55" stroke="#FF834D" stroke-width="3"/><path d="M50 5L10 55" stroke="#FF834D" stroke-width="3"/></svg>`) : replaceColor(`<svg width="60" height="60" viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M27.7778 19.2857H10V40.7143H27.7778L50 55V5L27.7778 19.2857Z" fill="#FF834D"/></svg>`);
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
