export function makeGoFullscreenBtn (container: HTMLElement) {
    const btn = document.createElement('button');
    btn.textContent = 'Toggle Fullscreen';
    btn.style.position = 'absolute';
    btn.style.left = '10px';
    btn.style.top = '10px';
    btn.style.zIndex = '1000';
    btn.addEventListener('click', () => {
        if (document.fullscreenElement) {
            document.exitFullscreen();
        } else {
            document.documentElement.requestFullscreen();
        }
    });
    container.appendChild(btn);
    return btn;
}