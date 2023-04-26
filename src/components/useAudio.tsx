import { use, useEffect, useState } from 'react';

const useAudio = (url: string) => {
	const [audio, setAudio] = useState<HTMLAudioElement>();
	const [playing, setPlaying] = useState(false);

	useEffect(() => {
		let audio = new Audio(url);

		console.log(url);

		audio.volume = 0.1;

		audio.addEventListener('ended', () => setPlaying(false));

		setAudio(audio);

		return () => {
			audio.removeEventListener('ended', () => setPlaying(false));
		};
	}, [url]);

	const toggle = () => {
		setPlaying((playingOld) => {
			if (playingOld) {
				audio?.pause();
			} else {
				audio?.play();
			}
			return !playingOld;
		});
	};

	return { playing, toggle };
};

export default useAudio;
