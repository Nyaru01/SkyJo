const SkyjoVirtuelButton = ({ onClick }) => (
    <div className="group relative mt-4 w-full">
        <button
            type="button"
            onClick={onClick}
            aria-label="Lancer le mode Skyjo virtuel"
            className="relative block w-full overflow-hidden rounded-[24px] bg-transparent text-left transition-transform duration-200 hover:scale-[1.01] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 active:scale-[0.985]"
        >
            <img src="/skyjo-virtual-mode-button.svg" alt="Skyjo virtuel — lancer une partie" className="block h-auto w-full" />
        </button>
    </div>
);

export default SkyjoVirtuelButton;
