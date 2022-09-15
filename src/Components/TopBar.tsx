import React from 'react';
import hidergoLogo from '../assets/hidergo_logo.png';

const TopBarContainer : React.CSSProperties = {
    background: '#373737',
    padding: 10,
    margin: 0,
    flex: 1,
    display: 'flex',
    maxHeight: 48,
    flexDirection: 'row',
    color: '#FFF',
    
    fontWeight: 800,
    fontFamily: 'AlumniSansPinstripe',
};

const topBarButton : React.CSSProperties = {
    textAlign: 'center',
    fontSize: '2em',
    flex: 1,
    cursor: 'pointer',
    borderRight: '1px solid #888',
};

type OnChangeViewCallback = (view: string) => any;

export default function TopBar (props: {onChangeView: OnChangeViewCallback}) {
    
    return (
        <div style={TopBarContainer}>
            <div style={{flex: 1, display: 'flex'}}>
                <img src={hidergoLogo} style={{ flex: 1, maxWidth: 100}} />
            </div>
            <div style={{flex: 8, padding: 0, margin: 0}}>
                <div style={{display: 'flex', flex: 1, flexDirection: 'row', alignItems: 'center', height: '100%'}}>
                    <div style={topBarButton} onClick={() => {props.onChangeView("home")}}>
                        <p style={{padding: 0, margin: 0}}>
                            Home
                        </p>
                    </div>
                    <div style={topBarButton}>  
                        <p style={{padding: 0, margin: 0}} onClick={() => {props.onChangeView("keymapeditor")}}>
                            Keymap
                        </p>
                    </div>
                    <div style={{...topBarButton, ...{borderRight: 'none'}}}>
                        <p style={{padding: 0, margin: 0}}>
                            Display
                        </p>
                    </div>
                </div>
            </div>
            <div style={{flex: 1, display: 'flex', flexDirection: 'column'}}>
                <div style={{flex: 1}}>
                    Device:
                </div>
                <div style={{flex: 1, marginBottom: 5}}>
                    <select>
                        <option>
                            Split
                        </option>
                    </select>
                </div>
            </div>
            
        </div>
    )

}