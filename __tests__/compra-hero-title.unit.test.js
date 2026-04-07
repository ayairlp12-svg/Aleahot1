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

describe('Hero de compra', () => {
    const compraPageSource = leerArchivo('js/compra-page.js');
    const helpersSource = extraerBloque(
        compraPageSource,
        'function obtenerUtilidadesHeroCompra()',
        '\n    function obtenerConfigLocalCompartida()'
    );
    const resolverSource = extraerBloque(
        compraPageSource,
        'function obtenerNombreOrganizadorInicialCompra()',
        '\n    function actualizarHeroCompraDesdeConfig()'
    );

    test('ignora placeholders genericos al resolver el nombre del organizador', () => {
        const context = {};
        vm.createContext(context);
        vm.runInContext(
            `
            const HERO_TITULO_DEFAULT = 'Elige tus boletos y participa ahora';
            const window = {};
            ${helpersSource}
            const heroUtils = obtenerUtilidadesHeroCompra();
            globalThis.resultado = {
                sorteo: heroUtils.resolverOrganizador('Sorteo'),
                sorteoActual: heroUtils.resolverOrganizador('Sorteo actual'),
                valido: heroUtils.resolverOrganizador(' Chicas   Bien ')
            };
            `,
            context
        );

        expect(context.resultado.sorteo).toBe('');
        expect(context.resultado.sorteoActual).toBe('');
        expect(context.resultado.valido).toBe('Chicas Bien');
    });

    test('prefiere un nombre cacheado valido si la config actual aun trae un placeholder', () => {
        const localStorageMock = {
            getItem: jest.fn((key) => {
                if (key === 'rifaplus_compra_hero_organizador') {
                    return 'Chicas Bien';
                }
                return null;
            })
        };

        const context = {
            localStorage: localStorageMock
        };
        context.window = {
            __RIFAPLUS_COMPRA_HERO_UTILS__: null,
            __RIFAPLUS_COMPRA_HERO__: {
                organizador: 'Sorteo'
            },
            rifaplusConfig: {
                cliente: {
                    nombre: 'Sorteo'
                }
            }
        };

        vm.createContext(context);
        vm.runInContext(
            `
            const HERO_TITULO_DEFAULT = 'Elige tus boletos y participa ahora';
            const window = globalThis.window;
            ${helpersSource}
            function obtenerConfigCompra() {
                return window.rifaplusConfig;
            }
            ${resolverSource}
            function obtenerConfigLocalCompartida() {
                return {};
            }
            globalThis.resultado = obtenerNombreOrganizadorInicialCompra();
            `,
            context
        );

        expect(context.resultado).toBe('Chicas Bien');
    });
});
