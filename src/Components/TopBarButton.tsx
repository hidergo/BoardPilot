import { colorPalette } from "../Styles/Colors";
import Device from "../misc/Device";

type TopBarButtonProps = {
    label: string,
    currentView: string,
    view: string,
    onButtonClick: any,
};

const topBarButton: React.CSSProperties = {
    paddingTop: 24,
    height: 70,
    textAlign: 'center',
    fontSize: '1.5em',
    flex: 1,
    cursor: 'pointer',
};


export function TopBarButton({ label, currentView, view, onButtonClick }: TopBarButtonProps) {
    const buttonStyle: React.CSSProperties = currentView === view ? {
        ...topBarButton,
        backgroundColor: colorPalette.backgroundLight,
    } : topBarButton;

    if(Device.selectedDevice) {
        if(!Device.selectedDevice.moduleEnabled(view))
            return null;
    }

    return (
        <div style={buttonStyle} onClick={() => onButtonClick(view)}>
            <p style={{ padding: 0, margin: 0 }}>
                {label}
            </p>
        </div>
    );
}