/* ================================================================ */
/* ARCHIVO: admin-layout.js                                         */
/* DESCRIPCIÓN: Lógica compartida para todas las páginas admin      */
/*              - Gestión de autenticación                          */
/*              - Menú lateral                                      */
/*              - Navegación entre páginas                          */
/* ================================================================ */

const ADMIN_LAYOUT = {
    tokenKey: 'rifaplus_admin_token',
    apiUrl: 'http://127.0.0.1:5001',
    
    /**
     * Inicializar el layout del admin
     * Debe llamarse en el evento load de cada página
     */
    init() {
        console.log('🔧 [AdminLayout] Inicializando...');
        
        // Verificar token
        this.verificarAutenticacion();
        
        // Configurar logo
        this.configurarLogo();
        
        // Configurar botón logout
        this.configurarLogout();
        
        // Configurar menú sidebar
        this.configurarSidebar();
        
        // Establecer página activa en el menú
        this.establecerPaginaActiva();
        
        console.log('✅ [AdminLayout] Inicializado correctamente');
    },
    
    /**
     * Verificar que el usuario esté autenticado
     * Si no, redirigir al dashboard solo si estamos en una página que NO es admin-dashboard.html
     */
    verificarAutenticacion() {
        // Buscar token de múltiples fuentes para garantizar consistencia
        const token = localStorage.getItem('rifaplus_token') || 
                     localStorage.getItem('rifaplus_admin_token') ||
                     localStorage.getItem('admin_token') ||
                     localStorage.getItem('token');
        
        const paginaActual = window.location.pathname.split('/').pop() || 'admin-dashboard.html';
        
        // Si hay token, asegurar que está en todas las claves
        if (token) {
            localStorage.setItem('rifaplus_token', token);
            localStorage.setItem('rifaplus_admin_token', token);
        }
        
        // Si no hay token y NO estamos en admin-dashboard, redirigir
        if (!token && paginaActual !== 'admin-dashboard.html') {
            console.warn('⚠️  [AdminLayout] Sin token, redirigiendo al login...');
            window.location.href = 'admin-dashboard.html';
            return false;
        }
        
        return token;
    },
    
    /**
     * Configurar el logo y título del header
     */
    configurarLogo() {
        const config = window.rifaplusConfig || {};
        const nombreCliente = config.cliente?.nombre || 'SORTEOS YEPE';
        const logoCliente = config.cliente?.logo || 'images/logo.png';
        
        // Buscar elementos del header
        const logoImg = document.querySelector('.admin-logo-container img');
        const titleSub = document.querySelector('.admin-header-title-sub');
        
        if (logoImg) logoImg.src = logoCliente;
        if (titleSub) titleSub.textContent = nombreCliente;
    },
    
    /**
     * Configurar el botón de logout
     */
    configurarLogout() {
        const logoutBtn = document.querySelector('.admin-logout-btn');
        
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                this.logout();
            });
        }
    },
    
    /**
     * Cerrar sesión
     */
    logout() {
        if (confirm('¿Estás seguro de que deseas cerrar sesión?')) {
            localStorage.removeItem(this.tokenKey);
            localStorage.removeItem('rifaplus_token');
            localStorage.removeItem('admin_token');
            localStorage.removeItem('token');
            window.location.href = 'admin-dashboard.html';
        }
    },
    
    /**
     * Configurar el menú sidebar
     */
    configurarSidebar() {
        const toggleBtn = document.querySelector('.admin-sidebar-toggle');
        const sidebar = document.querySelector('.admin-sidebar');
        const mainContent = document.querySelector('.admin-main');
        const navBtns = document.querySelectorAll('.admin-nav-btn');
        
        // Toggle button (móvil)
        if (toggleBtn && sidebar) {
            toggleBtn.addEventListener('click', () => {
                sidebar.classList.toggle('mobile-open');
            });
            
            // Cerrar sidebar al hacer clic en un enlace
            navBtns.forEach(btn => {
                btn.addEventListener('click', () => {
                    sidebar.classList.remove('mobile-open');
                });
            });
            
            // Cerrar sidebar al hacer clic fuera
            document.addEventListener('click', (e) => {
                if (!sidebar.contains(e.target) && !toggleBtn.contains(e.target)) {
                    sidebar.classList.remove('mobile-open');
                }
            });
        }
        
        // Toggle de collapse (desktop)
        const collapseBtn = document.querySelector('.admin-sidebar-collapse-btn');
        if (collapseBtn && sidebar && mainContent) {
            collapseBtn.addEventListener('click', () => {
                sidebar.classList.toggle('collapsed');
                mainContent.classList.toggle('sidebar-collapsed');
                
                // Guardar preferencia
                const isCollapsed = sidebar.classList.contains('collapsed');
                localStorage.setItem('admin-sidebar-collapsed', isCollapsed ? 'true' : 'false');
            });
            
            // Restaurar preferencia guardada
            const wasCollapsed = localStorage.getItem('admin-sidebar-collapsed') === 'true';
            if (wasCollapsed) {
                sidebar.classList.add('collapsed');
                mainContent.classList.add('sidebar-collapsed');
            }
        }
    },
    
    /**
     * Establecer la página actual como activa en el menú
     */
    establecerPaginaActiva() {
        const paginaActual = window.location.pathname.split('/').pop() || 'admin-dashboard.html';
        const navBtns = document.querySelectorAll('.admin-nav-btn');
        
        navBtns.forEach(btn => {
            const href = btn.getAttribute('href');
            if (href === paginaActual || (paginaActual === '' && href === 'admin-dashboard.html')) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
    },
    
    /**
     * Obtener el token de autenticación
     */
    getToken() {
        return localStorage.getItem(this.tokenKey);
    },
    
    /**
     * Hacer una petición autenticada al API
     */
    async fetchAutenticado(url, opciones = {}) {
        const token = this.getToken();
        
        if (!token) {
            throw new Error('No hay token de autenticación');
        }
        
        const headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            ...opciones.headers
        };
        
        const response = await fetch(url, {
            ...opciones,
            headers
        });
        
        // Si recibimos 401, significa que el token expiró
        if (response.status === 401) {
            console.error('❌ Token expirado');
            this.logout();
            return;
        }
        
        return response;
    }
};

// Inicializar cuando el DOM está listo
document.addEventListener('DOMContentLoaded', () => {
    ADMIN_LAYOUT.init();
});
