const path = require('path');
const crypto = require('crypto');
const ASSET_TYPES = Object.freeze({
    GALLERY: 'gallery',
    PRINCIPAL: 'principal',
    LOGO: 'logo',
    COMPROBANTE: 'comprobante'
});

const IMAGE_UPLOAD_PRESETS = Object.freeze({
    [ASSET_TYPES.GALLERY]: {
        folder: 'rifaplus/sorteos',
        maxWidth: 2200,
        maxHeight: 2200,
        quality: 'auto:good',
        format: 'webp'
    },
    [ASSET_TYPES.PRINCIPAL]: {
        folder: 'rifaplus/sorteos',
        maxWidth: 2200,
        maxHeight: 2200,
        quality: 'auto:good',
        format: 'webp'
    },
    [ASSET_TYPES.LOGO]: {
        folder: 'rifaplus/sorteos',
        maxWidth: 1200,
        maxHeight: 1200,
        quality: 'auto:best',
        format: 'webp'
    },
    [ASSET_TYPES.COMPROBANTE]: {
        folder: 'rifas-comprobantes',
        maxWidth: 2200,
        maxHeight: 2600,
        quality: 'auto:best',
        format: 'jpg'
    }
});

function normalizarAssetType(valor) {
    const assetType = String(valor || '').trim().toLowerCase();
    if (Object.values(ASSET_TYPES).includes(assetType)) {
        return assetType;
    }

    return ASSET_TYPES.GALLERY;
}

function sanitizarNombreBase(nombreArchivo = '') {
    return String(path.parse(nombreArchivo).name || 'archivo')
        .normalize('NFKD')
        .replace(/[^\w.-]+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '')
        .slice(0, 48)
        || 'archivo';
}

function esMimeVectorial(mimetype = '') {
    return String(mimetype || '').toLowerCase() === 'image/svg+xml';
}

function esMimePdf(mimetype = '') {
    return String(mimetype || '').toLowerCase() === 'application/pdf';
}

function construirPublicId({ assetType, originalName }) {
    const nombreBase = sanitizarNombreBase(originalName);
    const sufijo = crypto.randomBytes(6).toString('hex');
    return `${assetType}-${Date.now()}-${nombreBase}-${sufijo}`;
}

function construirOpcionesUpload({ assetType, originalName, mimetype }) {
    const assetTypeNormalizado = normalizarAssetType(assetType);
    const preset = IMAGE_UPLOAD_PRESETS[assetTypeNormalizado];
    const esPdf = esMimePdf(mimetype);
    const esVector = esMimeVectorial(mimetype);
    const resourceType = esPdf ? 'raw' : 'image';
    const options = {
        folder: preset.folder,
        resource_type: resourceType,
        public_id: construirPublicId({
            assetType: assetTypeNormalizado,
            originalName
        }),
        overwrite: true,
        unique_filename: false,
        use_filename: false,
        secure: true,
        invalidate: true
    };

    if (esPdf || esVector) {
        return options;
    }

    options.format = preset.format;
    options.transformation = [{
        width: preset.maxWidth,
        height: preset.maxHeight,
        crop: 'limit',
        quality: preset.quality,
        flags: 'strip_profile'
    }];

    return options;
}

async function subirBufferACloudinary({ buffer, originalName, mimetype, assetType }) {
    const cloudinary = require('../cloudinary-config');
    const options = construirOpcionesUpload({ assetType, originalName, mimetype });

    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            options,
            (error, result) => {
                if (error) {
                    reject(new Error(`Cloudinary upload error: ${error.message}`));
                    return;
                }

                resolve({
                    secureUrl: result.secure_url,
                    publicId: result.public_id,
                    bytes: result.bytes,
                    width: result.width,
                    height: result.height,
                    format: result.format,
                    resourceType: result.resource_type
                });
            }
        );

        uploadStream.on('error', (error) => {
            reject(new Error(`Stream error: ${error.message}`));
        });

        uploadStream.end(buffer);
    });
}

module.exports = {
    ASSET_TYPES,
    IMAGE_UPLOAD_PRESETS,
    normalizarAssetType,
    construirOpcionesUpload,
    subirBufferACloudinary
};
