const Loading = ({ message }: { message?: string }) => (
	<div className="w-full h-full flex flex-col items-center justify-center text-white">
		<div className="text-3xl">{message}</div>
		<img className="" src="loader.svg" />
	</div>
);

export default Loading;
