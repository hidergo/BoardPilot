#include <stdint.h>
#include <string.h>
#include <math.h>
#include "../hdl-core/hdl.h"
#include "compiled/hdl-compiled.h"

#define HDL_MAX_SIZE 4096
#define HDL_SCREEN_BUFFER_MAX_SIZE (80 * 128 / 8)

struct HDL_Interface _hdl_interface = { 0 };

uint8_t _screen_buffer[HDL_SCREEN_BUFFER_MAX_SIZE] = { 0xFF };

// 0 = not initialized, 1 = not built, 2 = initialized & built
uint8_t _hdl_initialized = 0;

//********************************
// DRAW APIS
//*******************************

// Clear screen
void _f_clear_screen (int16_t x, int16_t y, uint16_t w, uint16_t h) {
    memset(_screen_buffer, 0xFF, sizeof(_screen_buffer));
}

// Horizontal line
void _f_h_line (int16_t x, int16_t y, int16_t len) {
    if((uint16_t)len + (uint16_t)x >= _hdl_interface.width) {
        len = _hdl_interface.width - x;
    }
    // Don't draw outside bounds
    if(x >= _hdl_interface.width || y < 0 || y >= _hdl_interface.height)
        return;

    for(int i = x; i < x + len; i++) {
        _screen_buffer[y * (_hdl_interface.width/8) + i / 8] &= ~(1 << (7 - (i % 8)));
    }
}

void _f_v_line (int16_t x, int16_t y, int16_t len) {
    if((uint16_t)len + (uint16_t)y >= _hdl_interface.height) {
        len = _hdl_interface.height - y - 1;
    }
    // Don't draw outside bounds
    if(x < 0 || x >= _hdl_interface.width || y >= _hdl_interface.height)
        return;

    for(int i = y; i < y + len; i++) {
        _screen_buffer[i * (_hdl_interface.width/8) + x / 8] &= ~(1 << (7 - (x % 8)));
    }
}

void _f_pixel (int16_t x, int16_t y) {
    
    // Don't draw outside bounds
    if(x < 0 || x >= _hdl_interface.width || y < 0 || y >= _hdl_interface.height)
        return;

    _screen_buffer[y * (_hdl_interface.width/8) + x / 8] &= ~(1 << (7 - (x % 8)));

    return;
}

void _f_render () {

}

void _f_render_part (int16_t x, int16_t y, uint16_t w, uint16_t h) {

}

extern const char HDL_FONT[2048];

void _f_text (int16_t x, int16_t y, const char *text, uint8_t fontSize) {
    int len = strlen(text);
    int line = 0;
    int acol = 0;

    for (int g = 0; g < len; g++) {
		// Starting character in single quotes

        if (text[g] == '\n') {
			line++;
			acol = 0;
			continue;
		}
		else if (text[g] == ' ') {
			acol++;
		}
		
		for (int py = 0; py < 8; py++) {
			for (int px = 0; px < 5; px++) {
				if ((HDL_FONT[text[g] * 8 + py] >> (7 - px)) & 1) {
                    int rx = x + (px + acol * 5) * fontSize;
                    int ry = y + (py + line * 6) * fontSize;

                    for(int sy = 0; sy < fontSize; sy++) {
                        for(int sx = 0; sx < fontSize; sx++) {
                            _f_pixel(rx + sx, ry + sy);
                        }
                    }
				}
			}
		}
		acol++;

    }
}

#define PI 3.14159265

void _f_arc(int16_t xc, int16_t yc, int16_t radius, uint16_t start_angle, uint16_t end_angle) {
    int x, y, d;
    double angle;

    // Iterate through the angles from start_angle to end_angle
    for (angle = start_angle; angle < end_angle; angle += 1) {

        x = xc + radius * cos(angle * PI / 180.0) - 0.5;
        y = yc + radius * sin(angle * PI / 180.0) - 0.5;

        // Plot the point (x, y)
        _f_pixel(x, y);
    }
}

uint8_t *getScreenBuffer () {
    return _screen_buffer;
}

enum dsp_view {
    VIEW_MAIN,
    VIEW_SLEEP
};


// Bound values
struct {

    // View
    enum dsp_view view;
    // Battery percentage
    uint8_t batt_percent;
    // Battery sprite
    uint8_t batt_sprite;
    // Charging
    uint8_t charge;
    // RSSI
    int8_t rssi;

    uint16_t sensitivity;

    uint8_t layer;
    uint8_t btProfile;
    uint8_t splitConnected;
    
    // Time and date
    uint8_t hasTime;
    
    uint8_t hours;
    uint8_t minutes;

    uint16_t year;
    uint8_t month;
    uint8_t day;
    
    // 0 = monday
    uint8_t weekDay;

} dsp_binds;

// Sprite offset for battery icons
#define SPRITES_OFFSET_BATTERY  9
#define SPRITES_BATTERY_CHARGE  SPRITES_OFFSET_BATTERY + 6
#define SPRITES_BATTERY_EMPTY   SPRITES_OFFSET_BATTERY + 4
#define SPRITES_BATTERY_1_4     SPRITES_OFFSET_BATTERY + 3
#define SPRITES_BATTERY_2_4     SPRITES_OFFSET_BATTERY + 2
#define SPRITES_BATTERY_3_4     SPRITES_OFFSET_BATTERY + 1
#define SPRITES_BATTERY_FULL    SPRITES_OFFSET_BATTERY + 0

// Battery sprite count
#define SPRITES_BATTERY_COUNT   5

// Updates battery sprite index 
void update_battery_sprite () {
    // Set correct battery percentage
    uint8_t b = dsp_binds.batt_percent;
    dsp_binds.charge = 0;
    if(b <= 10) {
        dsp_binds.batt_sprite = SPRITES_BATTERY_EMPTY;
    }
    else if(b > 10 && b <= 30) {
        dsp_binds.batt_sprite = SPRITES_BATTERY_1_4;
    }
    else if(b > 30 && b <= 60) {
        dsp_binds.batt_sprite = SPRITES_BATTERY_2_4;
    }
    else if(b > 60 && b <= 85) {
        dsp_binds.batt_sprite = SPRITES_BATTERY_3_4;
    }
    else if(b > 85) {
        dsp_binds.batt_sprite = SPRITES_BATTERY_FULL;
    }
}


uint8_t buildHDL (uint16_t width, uint16_t height, uint8_t *data, uint32_t len) {

    dsp_binds.hours = 14;
    dsp_binds.minutes = 36;
    dsp_binds.year = 2023;
    dsp_binds.month = 4;
    dsp_binds.day = 1;
    dsp_binds.weekDay = 5;
    dsp_binds.hasTime = 1;
    dsp_binds.rssi = 0;
    dsp_binds.sensitivity = 128;
    dsp_binds.layer = 0;
    dsp_binds.btProfile = 0;
    dsp_binds.splitConnected = 1;

    dsp_binds.view = VIEW_MAIN;
    dsp_binds.batt_percent = 65;
    update_battery_sprite();
    dsp_binds.charge = 1;
    if(dsp_binds.charge) {
        dsp_binds.batt_sprite = SPRITES_BATTERY_CHARGE;
    }

    // HDL File too large
    if(len > HDL_MAX_SIZE)
        return 1;

    // Too many pixels
    if(width * height / 8 > sizeof(_screen_buffer))
        return 2;

    if(_hdl_initialized)
        HDL_Free(&_hdl_interface);

    _hdl_interface = HDL_CreateInterface(width, height, HDL_COLORS_MONO, HDL_FEAT_TEXT | HDL_FEAT_LINE_HV | HDL_FEAT_BITMAP);

    _hdl_interface.f_clear = _f_clear_screen;
    _hdl_interface.f_vline = _f_v_line;
    _hdl_interface.f_hline = _f_h_line;
    _hdl_interface.f_pixel = _f_pixel;
    _hdl_interface.f_render = _f_render;
    _hdl_interface.f_renderPart = _f_render_part;
    _hdl_interface.f_text = _f_text;
    _hdl_interface.f_arc = _f_arc;

    _hdl_interface.textHeight = 6;
    _hdl_interface.textWidth = 4;

    _hdl_initialized = 1;

    // Create bindings
    HDL_SetBinding(&_hdl_interface, "VIEW",          1, &dsp_binds.view, HDL_TYPE_I8);
    HDL_SetBinding(&_hdl_interface, "BATT_PERCENT",  2, &dsp_binds.batt_percent, HDL_TYPE_I8);
    HDL_SetBinding(&_hdl_interface, "BATT_SPRITE",   3, &dsp_binds.batt_sprite, HDL_TYPE_I8);
    HDL_SetBinding(&_hdl_interface, "CHRG",          4, &dsp_binds.charge, HDL_TYPE_BOOL);
    HDL_SetBinding(&_hdl_interface, "RSSI",          5, &dsp_binds.rssi, HDL_TYPE_I8);

    HDL_SetBinding(&_hdl_interface, "SENSITIVITY",   6, &dsp_binds.sensitivity, HDL_TYPE_I16);

    HDL_SetBinding(&_hdl_interface, "LAYER",   7, &dsp_binds.layer, HDL_TYPE_I8);
    HDL_SetBinding(&_hdl_interface, "BTPROFILE",   8, &dsp_binds.btProfile, HDL_TYPE_I8);
    HDL_SetBinding(&_hdl_interface, "SPLITCONNECTED",   9, &dsp_binds.splitConnected, HDL_TYPE_BOOL);

    // Time and date
    HDL_SetBinding(&_hdl_interface, "HASTIME",       20, &dsp_binds.hasTime, HDL_TYPE_BOOL);
    HDL_SetBinding(&_hdl_interface, "HOURS",         21, &dsp_binds.hours, HDL_TYPE_I8);
    HDL_SetBinding(&_hdl_interface, "MINUTES",       22, &dsp_binds.minutes, HDL_TYPE_I8);
    
    HDL_SetBinding(&_hdl_interface, "YEAR",          23, &dsp_binds.year, HDL_TYPE_I16);
    HDL_SetBinding(&_hdl_interface, "MONTH",         24, &dsp_binds.month, HDL_TYPE_I8);
    HDL_SetBinding(&_hdl_interface, "DAY",           25, &dsp_binds.day, HDL_TYPE_I8);
    HDL_SetBinding(&_hdl_interface, "WEEKDAY",       26, &dsp_binds.weekDay, HDL_TYPE_I8);


    // Add preloaded images
    // Preloaded images' id's must have the MSb as 1 (>0x8000)
    // Normal icons
    HDL_PreloadBitmap(&_hdl_interface, 0x8001, (uint8_t*)HDL_IMG_kb_icons_bmp_c, HDL_IMG_SIZE_kb_icons_bmp_c);
    // Big icons
    HDL_PreloadBitmap(&_hdl_interface, 0x8002, (uint8_t*)HDL_IMG_kb_icons_big_bmp_c, HDL_IMG_SIZE_kb_icons_big_bmp_c);
    
    int err = HDL_Build(&_hdl_interface, data, len);

    if(err == 0)
        _hdl_initialized = 2;

    return (_hdl_initialized == 2 ? 0 : 3);
}

uint8_t updateHDL () {

    return HDL_Update(&_hdl_interface, 0);
}