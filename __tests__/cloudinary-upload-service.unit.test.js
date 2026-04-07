const {
    ASSET_TYPES,
    normalizarAssetType,
    construirOpcionesUpload
} = require('../backend/services/cloudinaryUploadService');

describe('cloudinaryUploadService', () => {
    test('normaliza tipos desconocidos a gallery', () => {
        expect(normalizarAssetType('logo')).toBe(ASSET_TYPES.LOGO);
        expect(normalizarAssetType('principal')).toBe(ASSET_TYPES.PRINCIPAL);
        expect(normalizarAssetType('cualquier-cosa')).toBe(ASSET_TYPES.GALLERY);
    });

    test('aplica optimizacion agresiva pero segura para logo raster', () => {
        const options = construirOpcionesUpload({
            assetType: ASSET_TYPES.LOGO,
            originalName: 'Mi Logo Final.png',
            mimetype: 'image/png'
        });

        expect(options.folder).toBe('rifaplus/sorteos');
        expect(options.resource_type).toBe('image');
        expect(options.format).toBe('webp');
        expect(options.transformation).toEqual([
            expect.objectContaining({
                width: 1200,
                height: 1200,
                crop: 'limit',
                quality: 'auto:best',
                flags: 'strip_profile'
            })
        ]);
    });

    test('preserva svg sin forzar reconversion', () => {
        const options = construirOpcionesUpload({
            assetType: ASSET_TYPES.LOGO,
            originalName: 'logo-vector.svg',
            mimetype: 'image/svg+xml'
        });

        expect(options.resource_type).toBe('image');
        expect(options.format).toBeUndefined();
        expect(options.transformation).toBeUndefined();
    });

    test('optimiza comprobante de imagen con perfil conservador', () => {
        const options = construirOpcionesUpload({
            assetType: ASSET_TYPES.COMPROBANTE,
            originalName: 'transferencia.jpeg',
            mimetype: 'image/jpeg'
        });

        expect(options.folder).toBe('rifas-comprobantes');
        expect(options.resource_type).toBe('image');
        expect(options.format).toBe('jpg');
        expect(options.transformation).toEqual([
            expect.objectContaining({
                width: 2200,
                height: 2600,
                crop: 'limit',
                quality: 'auto:best',
                flags: 'strip_profile'
            })
        ]);
    });

    test('deja pdf de comprobante como raw sin reconvertir', () => {
        const options = construirOpcionesUpload({
            assetType: ASSET_TYPES.COMPROBANTE,
            originalName: 'comprobante.pdf',
            mimetype: 'application/pdf'
        });

        expect(options.folder).toBe('rifas-comprobantes');
        expect(options.resource_type).toBe('raw');
        expect(options.format).toBeUndefined();
        expect(options.transformation).toBeUndefined();
    });
});
