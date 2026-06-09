import { useCallback, useEffect, useRef, useState } from 'react';

const DURATION = 1800;
const COLORS = ['#818cf8', '#6366f1', '#a78bfa', '#c4b5fd', '#e0e7ff', '#fff'];

function rand(min: number, max: number) {
	return min + Math.random() * (max - min);
}

const KEYFRAMES = `
@keyframes bf-flash {
  0% { opacity: 0 }
  12% { opacity: 1 }
  100% { opacity: 0 }
}
@keyframes bf-rays {
  0% { transform: rotate(0deg) scale(0); opacity: 0.6 }
  100% { transform: rotate(25deg) scale(3); opacity: 0 }
}
@keyframes bf-ring {
  0% { transform: translate(-50%,-50%) scale(0); opacity: 0.7 }
  100% { transform: translate(-50%,-50%) scale(1); opacity: 0 }
}
@keyframes bf-text {
  0% { transform: translate(-50%,-50%) scale(0); opacity: 0 }
  20% { transform: translate(-50%,-50%) scale(1.3); opacity: 1 }
  35% { transform: translate(-50%,-50%) scale(0.9); opacity: 1 }
  45% { transform: translate(-50%,-50%) scale(1.05); opacity: 1 }
  55% { transform: translate(-50%,-50%) scale(1); opacity: 1 }
  80% { transform: translate(-50%,-50%) scale(1); opacity: 0.9 }
  100% { transform: translate(-50%,-50%) scale(1.2); opacity: 0 }
}
@keyframes bf-particle {
  0% { transform: translate(-50%,-50%) scale(1); opacity: 1 }
  60% { opacity: 0.7 }
  100% { transform: translate(calc(-50% + var(--px)), calc(-50% + var(--py))) scale(0); opacity: 0 }
}
@keyframes bf-sparkle {
  0% { transform: scale(0) rotate(0deg); opacity: 0 }
  30% { transform: scale(1.3) rotate(100deg); opacity: 1 }
  100% { transform: scale(0) rotate(200deg); opacity: 0 }
}
@media (prefers-reduced-motion: reduce) {
  .bf-root * { animation-duration: 0.01ms !important }
}
`;

const BoostAnimation = () => {
	const [trigger, setTrigger] = useState(0);
	const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

	const onBoost = useCallback(() => {
		setTrigger(t => t + 1);
		clearTimeout(timerRef.current);
		timerRef.current = setTimeout(() => setTrigger(0), DURATION);
	}, []);

	useEffect(() => {
		window.addEventListener('boost-activated', onBoost);
		return () => {
			window.removeEventListener('boost-activated', onBoost);
			clearTimeout(timerRef.current);
		};
	}, [onBoost]);

	if (!trigger) return null;

	const particles = Array.from({ length: 28 }, (_, i) => {
		const angle = (i / 28) * Math.PI * 2 + rand(-0.3, 0.3);
		const dist = rand(200, 550);
		return {
			px: Math.cos(angle) * dist,
			py: Math.sin(angle) * dist,
			size: rand(4, 12),
			delay: rand(0, 120),
			dur: rand(500, 900),
			color: COLORS[i % COLORS.length],
		};
	});

	const sparkles = Array.from({ length: 14 }, () => ({
		x: rand(8, 92),
		y: rand(8, 92),
		size: rand(12, 28),
		delay: rand(150, 700),
		dur: rand(500, 900),
		color: COLORS[Math.floor(rand(0, COLORS.length))],
	}));

	return (
		<div key={trigger} className='bf-root pointer-events-none fixed inset-0 z-50 overflow-hidden'>
			<style>{KEYFRAMES}</style>

			{/* radial flash */}
			<div
				style={{
					position: 'absolute',
					inset: 0,
					background:
						'radial-gradient(circle at center, rgba(99,102,241,0.4) 0%, rgba(99,102,241,0.12) 50%, transparent 75%)',
					animation: 'bf-flash 600ms ease-out forwards',
				}}
			/>

			{/* starburst rays */}
			<div
				style={{
					position: 'absolute',
					top: '50%',
					left: '50%',
					width: '100vmax',
					height: '100vmax',
					marginTop: '-50vmax',
					marginLeft: '-50vmax',
					background:
						'repeating-conic-gradient(from 0deg, rgba(129,140,248,0.12) 0deg, transparent 8deg, transparent 24deg)',
					borderRadius: '50%',
					animation: 'bf-rays 1200ms ease-out forwards',
				}}
			/>

			{/* shockwave rings */}
			{[0, 100].map((delay, i) => (
				<div
					key={i}
					style={{
						position: 'absolute',
						top: '50%',
						left: '50%',
						width: '150vmax',
						height: '150vmax',
						borderRadius: '50%',
						border: `${3 - i}px solid rgba(165,180,252,${0.5 - i * 0.15})`,
						animation: `bf-ring ${650 + i * 100}ms ease-out ${delay}ms forwards`,
						transform: 'translate(-50%,-50%) scale(0)',
					}}
				/>
			))}

			{/* center text */}
			<div
				style={{
					position: 'absolute',
					top: '50%',
					left: '50%',
					transform: 'translate(-50%,-50%) scale(0)',
					textAlign: 'center',
					animation: `bf-text ${DURATION - 200}ms ease-out 30ms forwards`,
					userSelect: 'none',
					padding: 'clamp(1.5rem, 5vw, 3rem) clamp(2rem, 8vw, 5rem)',
					borderRadius: '1.5rem',
					background:
						'radial-gradient(ellipse at center, rgba(15,10,40,0.85) 0%, rgba(15,10,40,0.5) 70%, transparent 100%)',
				}}
			>
				<div
					style={{
						fontSize: 'clamp(3.5rem, 14vw, 7rem)',
						fontWeight: 900,
						color: '#fff',
						textShadow:
							'0 0 20px rgba(99,102,241,1), 0 0 40px rgba(99,102,241,0.7), 0 0 80px rgba(139,92,246,0.5)',
						lineHeight: 1,
						WebkitTextStroke: '1px rgba(165,180,252,0.3)',
					}}
				>
					2&times;
				</div>
				<div
					style={{
						fontSize: 'clamp(1.1rem, 4vw, 1.8rem)',
						fontWeight: 800,
						color: '#c7d2fe',
						letterSpacing: '0.35em',
						marginTop: '0.15em',
						textShadow: '0 0 15px rgba(99,102,241,0.8), 0 2px 4px rgba(0,0,0,0.5)',
					}}
				>
					BOOST
				</div>
			</div>

			{/* particles */}
			{particles.map((p, i) => (
				<div
					key={i}
					style={
						{
							position: 'absolute',
							top: '50%',
							left: '50%',
							width: p.size,
							height: p.size,
							borderRadius: '50%',
							background: p.color,
							boxShadow: `0 0 ${p.size * 1.5}px ${p.color}`,
							'--px': `${p.px}px`,
							'--py': `${p.py}px`,
							animation: `bf-particle ${p.dur}ms ease-out ${p.delay}ms forwards`,
							transform: 'translate(-50%,-50%)',
						} as React.CSSProperties
					}
				/>
			))}

			{/* sparkles */}
			{sparkles.map((s, i) => (
				<div
					key={i}
					style={{
						position: 'absolute',
						left: `${s.x}%`,
						top: `${s.y}%`,
						fontSize: s.size,
						lineHeight: 1,
						color: s.color,
						filter: `drop-shadow(0 0 ${s.size / 3}px ${s.color})`,
						animation: `bf-sparkle ${s.dur}ms ease-in-out ${s.delay}ms forwards`,
						transform: 'scale(0)',
					}}
				>
					&#10022;
				</div>
			))}
		</div>
	);
};

export default BoostAnimation;
