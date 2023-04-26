import { getLoadingText } from '@/utils/loadingTexts';
import { useEffect, useState } from 'react';

const Loading = ({ textColor }: { textColor?: string }) => {
	const [loadingText, setLoadingText] = useState<string>();

	useEffect(() => {
		setLoadingText(getLoadingText());

		let interval = setInterval(() => {
			setLoadingText((oldText) => getLoadingText(oldText));
		}, 3000);

		return () => {
			clearInterval(interval);
		};
	}, []);

	return (
		<div className="flex flex-col items-center">
			<svg className="-ml-1 mb-3 h-7 w-7 animate-spin text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
				<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
				<path
					className="opacity-75"
					fill="currentColor"
					d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
				></path>
			</svg>
			<div className={`${textColor ? `text-${textColor}` : `text-white`} text-center text-sm font-semibold md:text-base`}>
				{loadingText}
			</div>
		</div>
	);
};

export default Loading;
