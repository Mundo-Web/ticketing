import AppLogoIcon from './app-logo-icon';

export default function AppLogo() {
    return (
        <>
            <div className="w-full object-contain flex items-center py-6">
                <AppLogoIcon className="w-full object-contain fill-current text-white dark:text-black" />
            </div>
            {/* <div className="ml-1 grid flex-1 text-left text-sm">
                <span className="mb-0.5 truncate leading-none font-semibold">ADK Assist</span>
            </div>*/}
        </>
    );
}
