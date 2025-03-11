// === Константы ===
const song = 'track1';
const skipTime = 30;

// === Настройка отладки ===
const DEBUG_MODE = true; // Установите в true для включения отладки

// === Шаги громкости ===
const volumeLevels = [0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30, 35, 40, 45, 50, 60, 70, 80, 90, 100];

// === DOM элементы ===
const player = document.querySelector('.akimPlayer');
const playBtn = document.querySelector('.play');
const prevBtn = document.querySelector('.prev');
const nextBtn = document.querySelector('.next');
const volCont = document.querySelector('.tVol');
const volBtn = document.querySelector('.volBtn');
const audio = document.querySelector('.audio');
const progCont = document.querySelector('.progControl');
const progress = document.querySelector('.tprogress');
const ppIcon = document.querySelector('.img__play');
const timeAudio = document.querySelector('.timeAudio');
const volControl = document.querySelector('.volControl');
const volReg = document.querySelector('.volReg');
const img__src = document.querySelector('.img__src');
const speedBtn = document.querySelector('.speedBtn');

// === Переменные состояния ===
let isTimeRemaining = false;
let previousVolume = 0.5;
let isMuted = false;
let currentSpeedIndex = 0;
const playbackSpeeds = [1.00, 1.25, 1.50, 1.75, 2.00];
let isDragging = false; // Вынесено из функций

// === Функции ===
const debugLog = (message) => {if (DEBUG_MODE) {console.log(message);}};

const formatTime = (seconds) => {
	const minutes = Math.floor(seconds / 60);
	const remainingSeconds = Math.floor(seconds % 60);
	const formattedMinutes = String(minutes).padStart(2, '0');
	const formattedSeconds = String(remainingSeconds).padStart(2, '0');
	return `${formattedMinutes}:${formattedSeconds}`;
};

const loadSong = (song) => {
	audio.src = `audio/${song}.mp3`;
	ppIcon.src = './ico/play.svg';
	audio.addEventListener('loadedmetadata', () => {timeAudio.textContent = `00:00/${formatTime(audio.duration)}`;debugLog("Метаданные аудио загружены");});
	audio.addEventListener('error', () => {if (DEBUG_MODE) {console.error("Ошибка загрузки аудио файла!");}});
	audio.volume = 0.5;
	previousVolume = 0.5;
	updateVolumeUI();
	updateVolumeIcon();
};

const playSong = () => {
	if (audio.src === "") {if (DEBUG_MODE) {console.error("Не указан источник аудио!");}return;}
	player.classList.add('play');
	ppIcon.src = './ico/pause.svg';
	audio.play().then(() => {debugLog("Начало воспроизведения");}).catch(error => {if (DEBUG_MODE) {console.error("Ошибка воспроизведения:", error);}});
};

const pauseSong = () => {
	player.classList.remove('play');
	ppIcon.src = './ico/play.svg';
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
	const {duration,currentTime} = e.target;
	if (isNaN(duration) || duration <= 0) {progress.style.width = '0%';return;}
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
	if (isMuted) {previousVolume = audio.volume;audio.volume = 0;} else {audio.volume = previousVolume === 0 ? 0.02 : previousVolume;}
	updateVolumeIcon();
	updateVolumeUI();
};

const updateVolumeIcon = () => {img__src.src = (audio.volume === 0 || isMuted) ? 'ico/volX.svg' : 'ico/vol.svg';};

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

const handleVolumeMouseUp = () => {isDragging = false;};
const handleVolumeMouseLeave = () => {isDragging = false;};

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

const toggleTimeRemaining = () => {isTimeRemaining = !isTimeRemaining;};
const updateSpeedButtonText = () => {speedBtn.textContent = `x${playbackSpeeds[currentSpeedIndex]}`;};
const setPlaybackSpeed = (speed) => {audio.playbackRate = speed;speedBtn.textContent = `x${speed}`}

const nextPlaybackSpeed = () => {
	currentSpeedIndex = (currentSpeedIndex + 1) % playbackSpeeds.length;
	const newSpeed = playbackSpeeds[currentSpeedIndex];
	setPlaybackSpeed(newSpeed);
	updateSpeedButtonText();
}

// === Обработчики событий ===
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
} else {if (DEBUG_MODE) {console.error('Элемент volControl не найден!');}}

if (volBtn) {volBtn.addEventListener('click', (e) => {e.stopPropagation();toggleMute();});} else {if (DEBUG_MODE) {console.error('Элемент volBtn не найден!');}}
if (speedBtn) {speedBtn.addEventListener('click', nextPlaybackSpeed);} else {if (DEBUG_MODE) {console.error('Элемент speedBtn не найден!');}}

// === Инициализация ===
loadSong(song);
updateSpeedButtonText(); // Устанавливаем начальный текст кнопки скорости.