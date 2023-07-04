import { colorPalette } from "../Styles/Colors";

type TopBarButtonProps = {
    label: string,
    currentView: string,
    view: string,
    onButtonClick: OnChangeViewCallback,
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

    return (
        <div style={buttonStyle} onClick={() => onButtonClick(view)}>
            <p style={{ padding: 0, margin: 0 }}>
                {label}
            </p>
        </div>
    );
}