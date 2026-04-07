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

describe('Modal contacto', () => {
    const source = leerArchivo('js/modal-contacto.js');

    test('normaliza whatsapp dejando solo 10 digitos', () => {
        const functionSource = extraerBloque(
            source,
            'function normalizarWhatsappContacto',
            '\nfunction validarDatosFormularioContacto'
        );

        const context = {};
        vm.createContext(context);
        vm.runInContext(functionSource, context);

        expect(context.normalizarWhatsappContacto('55 1234-5678 ext 99')).toBe('5512345678');
    });

    test('valida datos obligatorios del formulario', () => {
        const normalizarSource = extraerBloque(
            source,
            'function normalizarWhatsappContacto',
            '\nfunction validarDatosFormularioContacto'
        );
        const validarSource = extraerBloque(
            source,
            'function validarDatosFormularioContacto',
            '\nfunction aplicarErroresFormularioContacto'
        );

        const context = {};
        vm.createContext(context);
        vm.runInContext(`${normalizarSource}\n${validarSource}`, context);

        expect(context.validarDatosFormularioContacto({
            nombre: 'A',
            apellidos: '',
            whatsapp: '123',
            estado: '',
            ciudad: 'X'
        })).toEqual({
            nombre: 'El nombre debe tener al menos 2 caracteres',
            apellidos: 'Los apellidos deben tener al menos 2 caracteres',
            whatsapp: 'Ingresa exactamente 10 dígitos para WhatsApp',
            estado: 'Selecciona tu estado',
            ciudad: 'Por favor indica tu ciudad o localidad'
        });
    });
});
