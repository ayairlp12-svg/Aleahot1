const fs = require('fs');
const path = require('path');
const vm = require('vm');

function leerArchivo(relPath) {
    return fs.readFileSync(path.join(__dirname, '..', relPath), 'utf8');
}

function extraerBloque(source, startMarker, endMarker) {
    const start = source.indexOf(startMarker);
    if (start === -1) {
        throw new Error(`No se encontro el inicio: ${startMarker}`);
    }

    const end = source.indexOf(endMarker, start);
    if (end === -1) {
        throw new Error(`No se encontro el fin: ${endMarker}`);
    }

    return source.slice(start, end);
}

describe('Robustez del carrito global', () => {
    const carritoSource = leerArchivo('js/carrito-global.js');

    test('fuerza render si el hash coincide pero la lista del carrito esta vacia', () => {
        const functionSource = extraerBloque(
            carritoSource,
            'function debeRenderizarCarritoConSnapshot',
            '\nfunction obtenerRefsResumenCarrito'
        );

        document.body.innerHTML = '<div id="carritoItems"></div>';

        const context = {
            cachedBoletosHash: 'snapshot-1',
            document
        };

        vm.createContext(context);
        vm.runInContext(functionSource, context);

        const carritoItems = document.getElementById('carritoItems');
        expect(context.debeRenderizarCarritoConSnapshot(carritoItems, 'snapshot-1')).toBe(true);
    });

    test('no fuerza render si el hash coincide y la lista ya tiene items', () => {
        const functionSource = extraerBloque(
            carritoSource,
            'function debeRenderizarCarritoConSnapshot',
            '\nfunction obtenerRefsResumenCarrito'
        );

        document.body.innerHTML = '<div id="carritoItems"><div class="carrito-item"></div></div>';

        const context = {
            cachedBoletosHash: 'snapshot-1',
            document
        };

        vm.createContext(context);
        vm.runInContext(functionSource, context);

        const carritoItems = document.getElementById('carritoItems');
        expect(context.debeRenderizarCarritoConSnapshot(carritoItems, 'snapshot-1')).toBe(false);
    });

    test('fuerza render si el snapshot cambio', () => {
        const functionSource = extraerBloque(
            carritoSource,
            'function debeRenderizarCarritoConSnapshot',
            '\nfunction obtenerRefsResumenCarrito'
        );

        document.body.innerHTML = '<div id="carritoItems"><div class="carrito-item"></div></div>';

        const context = {
            cachedBoletosHash: 'snapshot-1',
            document
        };

        vm.createContext(context);
        vm.runInContext(functionSource, context);

        const carritoItems = document.getElementById('carritoItems');
        expect(context.debeRenderizarCarritoConSnapshot(carritoItems, 'snapshot-2')).toBe(true);
    });
});
