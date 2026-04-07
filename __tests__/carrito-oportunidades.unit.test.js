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

describe('Carrito oportunidades', () => {
    const source = leerArchivo('js/carrito-oportunidades.js');

    test('normaliza oportunidades quitando invalidos, duplicados y ordenando', () => {
        const functionSource = extraerBloque(
            source,
            'function normalizarOportunidadesCarrito',
            '\nfunction obtenerBoletosSeleccionadosCarritoOportunidades'
        );

        const context = {};
        vm.createContext(context);
        vm.runInContext(functionSource, context);

        expect(Array.from(context.normalizarOportunidadesCarrito([5, '3', 5, 0, -1, 'foo', 8]))).toEqual([3, 5, 8]);
    });

    test('devuelve arreglo vacio cuando la entrada no es valida', () => {
        const functionSource = extraerBloque(
            source,
            'function normalizarOportunidadesCarrito',
            '\nfunction obtenerBoletosSeleccionadosCarritoOportunidades'
        );

        const context = {};
        vm.createContext(context);
        vm.runInContext(functionSource, context);

        expect(Array.from(context.normalizarOportunidadesCarrito(null))).toEqual([]);
        expect(Array.from(context.normalizarOportunidadesCarrito([]))).toEqual([]);
    });
});
