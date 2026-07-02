import { useEffect, useRef, useState } from 'react';

const useAudio = (url: string) => {
	const audioRef = useRef<HTMLAudioElement | null>(null);
	const [playing, setPlaying] = useState(false);

	useEffect(() => {
		const audio = new Audio(url);

		audio.volume = 0.1;

		const onEnded = () => setPlaying(false);
		audio.addEventListener('ended', onEnded);
		audioRef.current = audio;

		return () => {
			audio.removeEventListener('ended', onEnded);
			audio.pause();
			audioRef.current = null;
		};
	}, [url]);

	const toggle = () => {
		setPlaying((playingOld) => {
			const audio = audioRef.current;

			if (playingOld) {
				audio?.pause();
			} else {
				void audio?.play();
			}

			return !playingOld;
		});
	};

	return { playing, toggle };
};

export default useAudio;
