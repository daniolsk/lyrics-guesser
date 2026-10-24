'use client';

import { useEffect, useRef, useState } from 'react';

import Image from 'next/image';
import Link from 'next/link';
import { AiOutlineLoading3Quarters } from 'react-icons/ai';
import { FaPause, FaPlay, FaSpotify } from 'react-icons/fa';

import { Song } from '@/utils/types';

type Status = 'idle' | 'loading' | 'playing' | 'paused' | 'unavailable';

const getPreviewUrl = async (song: Song) => {
	if (song.previewUrl) {
		return song.previewUrl;
	}

	const params = new URLSearchParams({
		title: song.songTitle,
		artist: song.songArtistNames || song.songArtist,
	});
	const response = await fetch(`/api/preview?${params.toString()}`);
	const data = await response.json().catch(() => null);
	return response.ok && typeof data?.previewUrl === 'string' ? (data.previewUrl as string) : null;
};

const STATUS_LABELS: Record<Status, string> = {
	idle: 'Play a preview',
	loading: 'Loading…',
	playing: 'Pause',
	paused: 'Resume',
	unavailable: 'No preview for this song',
};

// The album cover plays a short clip of the song when clicked, with a link to the full song on
// Spotify below. Remount it (key it by song) for each song, so the clip of the last one stops.
export default function SongCover({
	song,
	canPlay,
	className,
}: {
	song: Song;
	// The clip and the Spotify link would give the answer away while the player is still guessing,
	// so both show up only after the guess. The link keeps its space so the page doesn't jump.
	canPlay: boolean;
	className?: string;
}) {
	const audioRef = useRef<HTMLAudioElement>(null);
	const [status, setStatus] = useState<Status>('idle');
	const [progress, setProgress] = useState(0);

	useEffect(
		() => () => {
			audioRef.current?.pause();
		},
		[],
	);

	const togglePlayback = async () => {
		const audio = audioRef.current;
		if (status === 'loading' || status === 'unavailable') {
			return;
		}
		if (audio && status === 'playing') {
			audio.pause();
			return;
		}
		if (audio) {
			void audio.play();
			return;
		}

		setStatus('loading');
		const previewUrl = await getPreviewUrl(song).catch(() => null);
		if (!previewUrl) {
			setStatus('unavailable');
			return;
		}

		const newAudio = new Audio(previewUrl);
		newAudio.volume = 0.3;
		newAudio.addEventListener('playing', () => setStatus('playing'));
		newAudio.addEventListener('pause', () => setStatus('paused'));
		newAudio.addEventListener('ended', () => {
			newAudio.currentTime = 0;
			setProgress(0);
			setStatus('idle');
		});
		newAudio.addEventListener('timeupdate', () =>
			setProgress(newAudio.duration ? newAudio.currentTime / newAudio.duration : 0),
		);
		newAudio.addEventListener('error', () => setStatus('unavailable'));
		audioRef.current = newAudio;
		newAudio.play().catch(() => setStatus('unavailable'));
	};

	const cover = (
		<Image
			fill
			onContextMenu={(e) => e.preventDefault()}
			src={song.songImage}
			priority
			quality={75}
			sizes="(max-width: 768px) 100vw,
			(max-width: 1200px) 50vw,
			33vw"
			alt="song image"
			className={`object-cover shadow-[4.0px_8.0px_8.0px_rgba(0,0,0,0.38)]`}
		/>
	);

	const icon =
		status === 'loading' ? (
			<AiOutlineLoading3Quarters className="animate-spin" size={26} />
		) : status === 'playing' ? (
			<FaPause size={24} />
		) : (
			<FaPlay className="ml-1" size={24} />
		);

	return (
		<div className={`flex flex-col items-center ${className ?? ''}`}>
			{canPlay ? (
				<button
					type="button"
					onClick={() => void togglePlayback()}
					aria-label={STATUS_LABELS[status]}
					title={STATUS_LABELS[status]}
					disabled={status === 'unavailable'}
					className="group relative h-60 w-60 cursor-pointer bg-gray-1000 p-4 disabled:cursor-default sm:h-72 sm:w-72"
				>
					{cover}
					<div
						className={`absolute inset-0 z-10 flex flex-col items-center justify-center transition-colors ${
							status === 'playing'
								? 'bg-black/0 group-hover:bg-black/30'
								: 'bg-black/30 group-hover:bg-black/40'
						}`}
					>
						{status === 'unavailable' ? (
							<span className="bg-black/70 px-3 py-1 text-sm font-semibold">
								No preview for this song
							</span>
						) : (
							<>
								<span
									className={`flex h-16 w-16 items-center justify-center rounded-full bg-white/90 text-black shadow-[2px_5px_10px_rgba(0,0,0,0.5)] transition group-hover:scale-105 group-hover:bg-white ${
										status === 'playing'
											? 'opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100'
											: ''
									}`}
								>
									{icon}
								</span>
								{status === 'idle' ? (
									<span className="mt-3 text-sm font-semibold drop-shadow-[2px_3px_4px_rgb(0,0,0)]">
										Play a preview
									</span>
								) : null}
							</>
						)}
					</div>
					{status === 'playing' || status === 'paused' ? (
						<div className="absolute right-0 bottom-0 left-0 z-10 h-1 bg-white/20">
							<div className="h-full bg-white" style={{ width: `${progress * 100}%` }} />
						</div>
					) : null}
				</button>
			) : (
				<div className="relative h-60 w-60 bg-gray-1000 p-4 sm:h-72 sm:w-72">{cover}</div>
			)}
			<Link
				href={song.url}
				target="_blank"
				rel="noopener noreferrer"
				aria-hidden={!canPlay}
				tabIndex={canPlay ? undefined : -1}
				className={`mt-3 flex items-center text-sm font-semibold text-gray-300 hover:text-white ${
					canPlay ? '' : 'invisible'
				}`}
			>
				<FaSpotify className="mr-2 text-[#1DB954]" size={18} />
				Open in Spotify
			</Link>
		</div>
	);
}
