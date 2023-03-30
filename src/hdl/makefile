EXPORTED_FUNCTIONS=_buildHDL,_updateHDL,_getScreenBuffer

build:
	emcc ./hdl_driver.c ./font.c ./../hdl-core/hdl.c ./compiled/*.c -sEXPORTED_FUNCTIONS=$(EXPORTED_FUNCTIONS) \
			-s EXPORT_ES6=1 -s MODULARIZE=1 -s EXPORT_NAME=HDL_DRIVER -DNDEBUG -Oz --profiling-funcs --no-entry \
			-s EXPORTED_RUNTIME_METHODS=["cwrap"] \
			-o ./hdl_driver.js