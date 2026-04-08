const fs = require('fs');
const path = require('path');
const vm = require('vm');

function leerArchivo(relPath) {
    return fs.readFileSync(path.join(__dirname, '..', relPath), 'utf8');
}

describe('Modal sorteo finalizado', () => {
    const source = leerArchivo('js/modal-sorteo-finalizado.js');

    function cargarModalEnContexto() {
        document.body.innerHTML = '';
        document.head.innerHTML = '';

        const context = {
            window,
            document,
            console,
            sessionStorage,
            localStorage,
            setTimeout,
            clearTimeout
        };

        vm.createContext(context);
        vm.runInContext(source, context);

        return context.window.ModalSorteoFinalizado;
    }

    test('el boton verificar dispara la navegacion restringida al hacer click directo', () => {
        const ModalSorteoFinalizado = cargarModalEnContexto();
        const instancia = new ModalSorteoFinalizado();

        document.body.innerHTML = `
            <div id="modalSorteoFinalizadoOverlay">
                <button id="btnVerMisBoletos" class="btn btn-verificar">Verificar</button>
            </div>
        `;

        const navegarSpy = jest
            .spyOn(instancia, 'navegarAMisBoletosRestringido')
            .mockImplementation(() => {});

        instancia.configurarEventListeners();

        document.getElementById('btnVerMisBoletos').click();

        expect(navegarSpy).toHaveBeenCalledTimes(1);
    });
});
