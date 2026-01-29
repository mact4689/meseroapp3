// Simple notification sound using Web Audio API
let audioContext: AudioContext | null = null;

/**
 * Plays a notification sound when a new order arrives
 */
export const playNotificationSound = (): void => {
    try {
        if (!audioContext) {
            audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        }

        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        // Pleasant "ding" sound
        oscillator.frequency.value = 800; // Hz
        oscillator.type = 'sine';

        // Envelope for smooth sound
        gainNode.gain.setValueAtTime(0, audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.5);
    } catch (error) {
        console.error('Error playing notification sound:', error);
    }
};

/**
 * Plays a double beep for multiple orders
 */
export const playMultipleOrdersSound = (): void => {
    playNotificationSound();
    setTimeout(() => playNotificationSound(), 200);
};
