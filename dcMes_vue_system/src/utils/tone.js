function tone(audio) {
    const audioElement = new Audio(audio);
    audioElement.play().catch(error => {
        console.warn('音频播放失败:', error);
    });
}

export {
    tone
}