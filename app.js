class DocumentationApp {
    constructor() {
        this.data = this.loadData();
        this.currentPage = null;
        this.isEditMode = false;
        this.projectHandle = null;

        console.log('App initialized with data:', this.data);

        // Ensure data structure is valid
        if (!this.data || !this.data.items || !this.data.pages) {
            console.warn('Invalid data structure, resetting...');
            this.data = this.getEmptyData();
        }

        this.init();
    }

    init() {
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                this.bindEvents();
                this.showLaunchScreen();
            });
        } else {
            this.bindEvents();
            this.showLaunchScreen();
        }
    }

    showLaunchScreen() {
        const launchScreen = document.getElementById('launch-screen');
        const mainApp = document.getElementById('main-app');
        
        if (launchScreen && mainApp) {
            launchScreen.style.display = 'flex';
            mainApp.style.display = 'none';
        }
    }

    showMainApp() {
        const launchScreen = document.getElementById('launch-screen');
        const mainApp = document.getElementById('main-app');
        
        if (launchScreen && mainApp) {
            launchScreen.style.display = 'none';
            mainApp.style.display = 'flex';
            
            // Initialize the main app
            this.renderSidebar();
            this.loadHomePage();
        }
    }

    bindEvents() {
        console.log('Binding events...');

        // Launch screen buttons
        const loadExistingBtn = document.getElementById('load-existing-btn');
        const createNewBtn = document.getElementById('create-new-btn');

        if (loadExistingBtn) {
            loadExistingBtn.addEventListener('click', () => this.loadExistingProject());
        }

        if (createNewBtn) {
            createNewBtn.addEventListener('click', () => this.createNewProject());
        }

        // Header buttons
        const loadProjectBtn = document.getElementById('load-project-btn');
        const saveProjectBtn = document.getElementById('save-project-btn');
        const newProjectBtn = document.getElementById('new-project-btn');
        const newSectionBtn = document.getElementById('new-section-btn');
        const newPageBtn = document.getElementById('new-page-btn');
        const editModeBtn = document.getElementById('edit-mode-btn');

        if (loadProjectBtn) {
            loadProjectBtn.addEventListener('click', () => this.loadProject());
        }

        if (saveProjectBtn) {
            saveProjectBtn.addEventListener('click', () => this.saveProject());
        }

        if (newProjectBtn) {
            newProjectBtn.addEventListener('click', () => this.showLaunchScreen());
        }

        if (newSectionBtn) {
            newSectionBtn.addEventListener('click', () => this.showSectionModal());
        }

        if (newPageBtn) {
            newPageBtn.addEventListener('click', () => this.showPageModal());
        }

        if (editModeBtn) {
            editModeBtn.addEventListener('click', () => this.toggleEditMode());
        }

        // Edit mode buttons
        const saveBtn = document.getElementById('save-btn');
        const cancelBtn = document.getElementById('cancel-btn');

        if (saveBtn) saveBtn.addEventListener('click', () => this.savePage());
        if (cancelBtn) cancelBtn.addEventListener('click', () => this.cancelEdit());

        // Section modal
        const createSectionBtn = document.getElementById('create-section-btn');
        const cancelSectionBtn = document.getElementById('cancel-section-btn');

        if (createSectionBtn) createSectionBtn.addEventListener('click', () => this.createSection());
        if (cancelSectionBtn) cancelSectionBtn.addEventListener('click', () => this.hideSectionModal());

        // Page modal
        const createPageBtn = document.getElementById('create-page-btn');
        const cancelPageBtn = document.getElementById('cancel-page-btn');

        if (createPageBtn) createPageBtn.addEventListener('click', () => this.createPage());
        if (cancelPageBtn) cancelPageBtn.addEventListener('click', () => this.hidePageModal());

        // Edit section modal
        const saveSectionBtn = document.getElementById('save-section-btn');
        const cancelEditSectionBtn = document.getElementById('cancel-edit-section-btn');

        if (saveSectionBtn) saveSectionBtn.addEventListener('click', () => this.saveEditedSection());
        if (cancelEditSectionBtn) cancelEditSectionBtn.addEventListener('click', () => this.hideEditSectionModal());

        // Close modals on outside click
        const sectionModal = document.getElementById('section-modal');
        const pageModal = document.getElementById('page-modal');
        const editSectionModal = document.getElementById('edit-section-modal');

        if (sectionModal) {
            sectionModal.addEventListener('click', (e) => {
                if (e.target.id === 'section-modal') this.hideSectionModal();
            });
        }

        if (pageModal) {
            pageModal.addEventListener('click', (e) => {
                if (e.target.id === 'page-modal') this.hidePageModal();
            });
        }

        if (editSectionModal) {
            editSectionModal.addEventListener('click', (e) => {
                if (e.target.id === 'edit-section-modal') this.hideEditSectionModal();
            });
        }

        // Sidebar resizing
        this.initSidebarResize();

        console.log('Event binding complete');
    }

    initSidebarResize() {
        const sidebar = document.getElementById('sidebar');
        const resizer = document.getElementById('sidebar-resizer');

        if (!sidebar || !resizer) return;

        let isResizing = false;
        let startX = 0;
        let startWidth = 0;

        // Load saved width
        const savedWidth = localStorage.getItem('sidebar-width');
        if (savedWidth) {
            sidebar.style.width = savedWidth + 'px';
        }

        resizer.addEventListener('mousedown', (e) => {
            isResizing = true;
            startX = e.clientX;
            startWidth = parseInt(document.defaultView.getComputedStyle(sidebar).width, 10);

            resizer.classList.add('resizing');
            document.body.classList.add('resizing');

            e.preventDefault();
        });

        document.addEventListener('mousemove', (e) => {
            if (!isResizing) return;

            const width = startWidth + e.clientX - startX;
            const minWidth = 200;
            const maxWidth = 600;

            if (width >= minWidth && width <= maxWidth) {
                sidebar.style.width = width + 'px';
            }
        });

        document.addEventListener('mouseup', () => {
            if (isResizing) {
                isResizing = false;
                resizer.classList.remove('resizing');
                document.body.classList.remove('resizing');

                // Save the width
                const currentWidth = parseInt(document.defaultView.getComputedStyle(sidebar).width, 10);
                localStorage.setItem('sidebar-width', currentWidth);
            }
        });

        // Handle double-click to reset to default width
        resizer.addEventListener('dblclick', () => {
            sidebar.style.width = '300px';
            localStorage.setItem('sidebar-width', '300');
        });
    }

    loadData() {
        const saved = localStorage.getItem('documentation-data');
        if (saved) {
            try {
                const data = JSON.parse(saved);
                // Ensure the new data structure exists
                if (!data.items) {
                    console.log('Converting old data structure to new format');
                    return this.getEmptyData();
                }
                return data;
            } catch (e) {
                console.warn('Corrupted data, starting fresh');
                return this.getEmptyData();
            }
        }
        return this.getEmptyData();
    }

    getEmptyData() {
        return {
            items: {}, // All sections and subsections as flat items
            pages: {}
        };
    }

    saveData() {
        localStorage.setItem('documentation-data', JSON.stringify(this.data));
    }

    showSectionModal() {
        console.log('showSectionModal called');

        // Reset form
        const sectionNameInput = document.getElementById('section-name');
        if (sectionNameInput) {
            sectionNameInput.value = '';
        }

        // Populate location options
        this.updateLocationOptions();

        const modal = document.getElementById('section-modal');
        if (modal) {
            modal.style.display = 'block';
        }

        if (sectionNameInput) {
            sectionNameInput.focus();
        }
    }

    hideSectionModal() {
        const modal = document.getElementById('section-modal');
        if (modal) {
            modal.style.display = 'none';
        }

        const sectionNameInput = document.getElementById('section-name');
        if (sectionNameInput) {
            sectionNameInput.value = '';
        }

        const locationSelect = document.getElementById('section-location');
        if (locationSelect) {
            locationSelect.value = 'main';
        }
    }

    updateLocationOptions() {
        const select = document.getElementById('section-location');
        if (!select) return;

        select.innerHTML = '<option value="main">Main Section</option>';

        // Ensure data exists
        if (!this.data || !this.data.items) {
            return;
        }

        // Add all existing items as potential parents
        Object.keys(this.data.items).forEach(itemId => {
            const item = this.data.items[itemId];
            if (!item) return;

            const option = document.createElement('option');
            option.value = itemId;

            // Show hierarchy in the option text
            const hierarchy = this.getItemHierarchy(itemId);
            option.textContent = `Under: ${hierarchy}`;
            select.appendChild(option);
        });
    }

    getItemHierarchy(itemId) {
        const item = this.data.items[itemId];
        if (!item) return '';

        if (!item.parentId) {
            return item.name;
        }

        const parentHierarchy = this.getItemHierarchy(item.parentId);
        return `${parentHierarchy} → ${item.name}`;
    }

    showPageModal() {
        console.log('showPageModal called');

        const select = document.getElementById('parent-section');
        if (!select) {
            console.error('parent-section select not found');
            return;
        }

        select.innerHTML = '<option value="">Select Section or Subsection</option>';

        // Ensure data exists
        if (!this.data || !this.data.items) {
            console.warn('No data available for page modal');
            return;
        }

        // Add all items as potential parents for pages
        Object.keys(this.data.items).forEach(itemId => {
            const item = this.data.items[itemId];
            if (!item) return;

            const option = document.createElement('option');
            option.value = itemId;
            option.textContent = this.getItemHierarchy(itemId);
            select.appendChild(option);
        });

        const modal = document.getElementById('page-modal');
        if (modal) {
            modal.style.display = 'block';
        }

        const pageNameInput = document.getElementById('page-name');
        if (pageNameInput) {
            pageNameInput.focus();
        }
    }

    hidePageModal() {
        const modal = document.getElementById('page-modal');
        if (modal) {
            modal.style.display = 'none';
        }

        const parentSelect = document.getElementById('parent-section');
        if (parentSelect) {
            parentSelect.value = '';
        }

        const pageNameInput = document.getElementById('page-name');
        if (pageNameInput) {
            pageNameInput.value = '';
        }
    }

    createSection() {
        const location = document.getElementById('section-location').value;
        const sectionName = document.getElementById('section-name').value.trim();

        if (!sectionName) {
            alert('Please enter a section name');
            return;
        }

        const itemId = this.generateId(sectionName);
        const newItem = {
            id: itemId,
            name: sectionName,
            type: 'section',
            parentId: location === 'main' ? null : location,
            pages: []
        };

        this.data.items[itemId] = newItem;

        console.log('Created section:', newItem);
        this.saveData();
        this.renderSidebar();
        this.hideSectionModal();
    }

    createPage() {
        const parentId = document.getElementById('parent-section').value;
        const pageName = document.getElementById('page-name').value.trim();

        if (!parentId || !pageName) {
            alert('Please select a parent section and enter a page name');
            return;
        }

        const pageId = this.generateId(pageName);
        const page = {
            id: pageId,
            title: pageName,
            content: `# ${pageName}\n\nStart writing your content here...`,
            parentId: parentId
        };

        this.data.pages[pageId] = page;

        // Add page to parent's pages array
        if (this.data.items[parentId]) {
            if (!this.data.items[parentId].pages) {
                this.data.items[parentId].pages = [];
            }
            this.data.items[parentId].pages.push(pageId);
        }

        console.log('Created page:', page);
        this.saveData();
        this.renderSidebar();
        this.hidePageModal();
        this.loadPage(pageId);
    }

    generateId(inputName) {
        return inputName.toLowerCase()
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-+|-+$/g, '') + '-' + Date.now();
    }

    renderSidebar() {
        const nav = document.getElementById('sidebar-nav');
        if (!nav) return;

        nav.innerHTML = '';

        // Ensure data structure exists
        if (!this.data || !this.data.items) {
            console.warn('Data structure not initialized, resetting...');
            this.data = this.getEmptyData();
            return;
        }

        // Get root items (items with no parent)
        const rootItems = Object.keys(this.data.items)
            .map(id => this.data.items[id])
            .filter(item => item && !item.parentId)
            .sort((a, b) => a.name.localeCompare(b.name));

        rootItems.forEach(item => {
            this.renderItem(item, nav, 0);
        });
    }

    renderItem(item, container, level) {
        const itemDiv = document.createElement('div');
        itemDiv.className = level === 0 ? 'nav-section' : 'nav-subsection';
        itemDiv.style.marginLeft = `${level * 1}rem`;

        const titleDiv = document.createElement('div');
        titleDiv.className = level === 0 ? 'nav-section-title' : 'nav-subsection-title';
        titleDiv.innerHTML = `
            <span>${item.name}</span>
            <div class="section-actions">
                <button class="section-action-btn" onclick="app.editItem('${item.id}')" title="Edit Name">✎</button>
                <button class="section-action-btn" onclick="app.deleteItem('${item.id}')" title="Delete">×</button>
            </div>
        `;
        itemDiv.appendChild(titleDiv);

        // Add pages under this item
        if (item.pages) {
            item.pages.forEach(pageId => {
                const page = this.data.pages[pageId];
                if (page) {
                    const pageDiv = document.createElement('div');
                    pageDiv.className = 'nav-page';
                    pageDiv.style.marginLeft = `${(level + 1) * 1}rem`;

                    if (this.currentPage === pageId) {
                        pageDiv.classList.add('active');
                    }

                    pageDiv.textContent = page.title;
                    pageDiv.addEventListener('click', () => this.loadPage(pageId));
                    itemDiv.appendChild(pageDiv);
                }
            });
        }

        container.appendChild(itemDiv);

        // Add child items
        const childItems = Object.keys(this.data.items)
            .map(id => this.data.items[id])
            .filter(childItem => childItem.parentId === item.id)
            .sort((a, b) => a.name.localeCompare(b.name));

        childItems.forEach(childItem => {
            this.renderItem(childItem, container, level + 1);
        });
    }

    loadPage(pageId) {
        if (this.isEditMode) {
            this.toggleEditMode();
        }

        this.currentPage = pageId;
        const page = this.data.pages[pageId];

        if (page) {
            document.getElementById('markdown-content').innerHTML = marked.parse(page.content);
            document.getElementById('page-title').value = page.title;
            document.getElementById('markdown-editor').value = page.content;
        }

        this.renderSidebar(); // Update active state
    }

    loadHomePage() {
        this.currentPage = null;
        const homeContent = `# Welcome to Your Personal Documentation Profile

Create sections and pages to organize your life's documentation.

## Getting Started

1. Click **"New Section"** to create a main category (e.g., academic, professional, creative)
2. Click **"New Page"** to add content within a section
3. Use **"Edit Mode"** to modify existing pages
4. Write in Markdown format for rich formatting

## Markdown Tips

- Use \`#\` for headers
- Use \`**bold**\` for **bold text**
- Use \`*italic*\` for *italic text*
- Use \`-\` for bullet points
- Use \`1.\` for numbered lists

Start building your personal documentation system!`;

        document.getElementById('markdown-content').innerHTML = marked.parse(homeContent);
        this.renderSidebar();
    }

    toggleEditMode() {
        if (!this.currentPage) {
            alert('Please select a page to edit');
            return;
        }

        this.isEditMode = !this.isEditMode;
        const viewMode = document.getElementById('view-mode');
        const editMode = document.getElementById('edit-mode');
        const editBtn = document.getElementById('edit-mode-btn');

        if (this.isEditMode) {
            viewMode.style.display = 'none';
            editMode.style.display = 'flex';
            editBtn.textContent = 'View Mode';
            editBtn.style.background = '#dc3545';
        } else {
            viewMode.style.display = 'block';
            editMode.style.display = 'none';
            editBtn.textContent = 'Edit Mode';
            editBtn.style.background = '#17a2b8';
        }
    }

    savePage() {
        if (!this.currentPage) return;

        const title = document.getElementById('page-title').value.trim();
        const content = document.getElementById('markdown-editor').value;

        if (!title) {
            alert('Please enter a page title');
            return;
        }

        this.data.pages[this.currentPage].title = title;
        this.data.pages[this.currentPage].content = content;

        this.saveData();
        this.renderSidebar();

        // Update view mode
        document.getElementById('markdown-content').innerHTML = marked.parse(content);
        this.toggleEditMode();
    }

    cancelEdit() {
        // Reset form to original values
        const page = this.data.pages[this.currentPage];
        document.getElementById('page-title').value = page.title;
        document.getElementById('markdown-editor').value = page.content;
        this.toggleEditMode();
    }

    deleteItem(itemId) {
        const item = this.data.items[itemId];
        if (!item) return;

        if (!confirm(`Are you sure you want to delete "${item.name}" and all its content?`)) {
            return;
        }

        // Delete all pages in this item
        if (item.pages) {
            item.pages.forEach(pageId => {
                delete this.data.pages[pageId];
            });
        }

        // Delete all child items recursively
        const childItems = Object.keys(this.data.items)
            .filter(id => this.data.items[id].parentId === itemId);

        childItems.forEach(childId => {
            this.deleteItem(childId);
        });

        // Delete the item itself
        delete this.data.items[itemId];

        this.saveData();
        this.renderSidebar();

        // If current page was deleted, go to home
        if (this.currentPage && !this.data.pages[this.currentPage]) {
            this.loadHomePage();
        }
    }

    editItem(itemId) {
        const item = this.data.items[itemId];
        if (!item) return;

        this.currentEditingItemId = itemId;

        const editNameInput = document.getElementById('edit-section-name');
        if (editNameInput) {
            editNameInput.value = item.name;
        }

        const modal = document.getElementById('edit-section-modal');
        if (modal) {
            modal.style.display = 'block';
        }

        if (editNameInput) {
            editNameInput.focus();
            editNameInput.select();
        }
    }

    hideEditSectionModal() {
        const modal = document.getElementById('edit-section-modal');
        if (modal) {
            modal.style.display = 'none';
        }

        const editNameInput = document.getElementById('edit-section-name');
        if (editNameInput) {
            editNameInput.value = '';
        }

        this.currentEditingItemId = null;
    }

    saveEditedSection() {
        if (!this.currentEditingItemId) return;

        const newName = document.getElementById('edit-section-name').value.trim();
        if (!newName) {
            alert('Please enter a section name');
            return;
        }

        const item = this.data.items[this.currentEditingItemId];
        if (item) {
            const oldName = item.name;
            item.name = newName;

            console.log(`Renamed "${oldName}" to "${newName}"`);

            this.saveData();
            this.renderSidebar();
            this.hideEditSectionModal();
        }
    }

    async loadExistingProject() {
        try {
            await this.loadProject();
        } catch (error) {
            // Error handling is already in loadProject
        }
    }

    async createNewProject() {
        try {
            // Check if File System Access API is supported
            if (!window.showDirectoryPicker) {
                alert('File System Access API is not supported in this browser. Please use Chrome, Edge, or another Chromium-based browser.');
                return;
            }

            // Show directory picker for new project
            const directoryHandle = await window.showDirectoryPicker();
            this.projectHandle = directoryHandle;

            console.log('Creating new project in:', directoryHandle.name);

            // Start with empty data
            this.data = this.getEmptyData();

            // Create a welcome README file
            await this.createWelcomeFile();

            // Show save button
            const saveBtn = document.getElementById('save-project-btn');
            if (saveBtn) {
                saveBtn.style.display = 'inline-block';
            }

            // Show main app
            this.showMainApp();

            console.log('New project created successfully');
        } catch (error) {
            if (error.name !== 'AbortError') {
                console.error('Error creating new project:', error);
                alert('Error creating new project: ' + error.message);
            }
        }
    }

    async createWelcomeFile() {
        try {
            const welcomeContent = `# Welcome to Your Personal Documentation Profile

This is your new documentation project! Here's how to get started:

## Getting Started

1. **Create Sections** - Click "New Section" to create main categories (e.g., Academic, Professional, Creative)
2. **Add Subsections** - Create nested sections for better organization
3. **Write Pages** - Click "New Page" to add content within any section
4. **Edit Content** - Use the "Edit Mode" button to modify pages with Markdown

## Markdown Tips

- Use \`#\` for headers (# Main Header, ## Sub Header)
- Use \`**bold**\` for **bold text**
- Use \`*italic*\` for *italic text*
- Use \`-\` for bullet points
- Use \`1.\` for numbered lists
- Use \`\`\`code\`\`\` for code blocks

## Features

- **Hierarchical Organization** - Unlimited nesting of sections
- **Live Preview** - See your markdown rendered in real-time
- **File System Integration** - All changes save directly to your files
- **Resizable Interface** - Drag the sidebar edge to resize

Start building your personal documentation system!`;

            const fileHandle = await this.projectHandle.getFileHandle('README.md', { create: true });
            const writable = await fileHandle.createWritable();
            await writable.write(welcomeContent);
            await writable.close();

            console.log('Created welcome README.md file');
        } catch (error) {
            console.error('Error creating welcome file:', error);
        }
    }

    async loadProject() {
        try {
            // Check if File System Access API is supported
            if (!window.showDirectoryPicker) {
                alert('File System Access API is not supported in this browser. Please use Chrome, Edge, or another Chromium-based browser.');
                return;
            }

            // Show directory picker
            const directoryHandle = await window.showDirectoryPicker();
            this.projectHandle = directoryHandle;

            console.log('Loading project from:', directoryHandle.name);

            // Clear existing data
            this.data = this.getEmptyData();

            // Load project structure
            await this.loadProjectStructure(directoryHandle);

            // Show save button
            const saveBtn = document.getElementById('save-project-btn');
            if (saveBtn) {
                saveBtn.style.display = 'inline-block';
            }

            // Update UI
            this.showMainApp();
            this.renderSidebar();
            this.loadHomePage();

            console.log('Project loaded successfully');
        } catch (error) {
            if (error.name !== 'AbortError') {
                console.error('Error loading project:', error);
                alert('Error loading project: ' + error.message);
            }
        }
    }

    async loadProjectStructure(directoryHandle, parentId = null, level = 0) {
        try {
            for await (const [name, handle] of directoryHandle.entries()) {
                if (handle.kind === 'directory') {
                    // Create section for directory
                    const sectionId = this.generateId(name);
                    const section = {
                        id: sectionId,
                        name: name,
                        type: 'section',
                        parentId: parentId,
                        pages: [],
                        directoryHandle: handle
                    };

                    this.data.items[sectionId] = section;
                    console.log(`Created section: ${name} (level ${level})`);

                    // Recursively load subdirectories
                    await this.loadProjectStructure(handle, sectionId, level + 1);

                } else if (handle.kind === 'file' && name.endsWith('.md')) {
                    // Create page for markdown file
                    const pageId = this.generateId(name.replace('.md', ''));
                    const file = await handle.getFile();
                    const content = await file.text();

                    const page = {
                        id: pageId,
                        title: name.replace('.md', ''),
                        content: content,
                        parentId: parentId,
                        fileHandle: handle,
                        fileName: name
                    };

                    this.data.pages[pageId] = page;

                    // Add to parent's pages
                    if (parentId && this.data.items[parentId]) {
                        if (!this.data.items[parentId].pages) {
                            this.data.items[parentId].pages = [];
                        }
                        this.data.items[parentId].pages.push(pageId);
                    }

                    console.log(`Loaded page: ${name}`);
                }
            }
        } catch (error) {
            console.error('Error loading directory structure:', error);
        }
    }

    async saveProject() {
        if (!this.projectHandle) {
            alert('No project loaded. Please load a project first.');
            return;
        }

        try {
            console.log('Saving project...');

            // Save all pages
            for (const pageId in this.data.pages) {
                const page = this.data.pages[pageId];
                await this.savePageToFile(page);
            }

            // Create new directories and files as needed
            await this.createNewStructure();

            console.log('Project saved successfully');
            alert('Project saved successfully!');

        } catch (error) {
            console.error('Error saving project:', error);
            alert('Error saving project: ' + error.message);
        }
    }

    async savePageToFile(page) {
        try {
            if (page.fileHandle) {
                // Update existing file
                const writable = await page.fileHandle.createWritable();
                await writable.write(page.content);
                await writable.close();
                console.log(`Updated: ${page.fileName}`);
            } else {
                // Create new file
                const parentItem = this.data.items[page.parentId];
                if (parentItem && parentItem.directoryHandle) {
                    const fileName = `${page.title}.md`;
                    const fileHandle = await parentItem.directoryHandle.getFileHandle(fileName, { create: true });
                    const writable = await fileHandle.createWritable();
                    await writable.write(page.content);
                    await writable.close();

                    // Store the handle for future saves
                    page.fileHandle = fileHandle;
                    page.fileName = fileName;

                    console.log(`Created: ${fileName}`);
                }
            }
        } catch (error) {
            console.error(`Error saving page ${page.title}:`, error);
        }
    }

    async createNewStructure() {
        try {
            // Create new directories for sections that don't have directory handles
            for (const itemId in this.data.items) {
                const item = this.data.items[itemId];
                if (!item.directoryHandle) {
                    await this.createDirectory(item);
                }
            }
        } catch (error) {
            console.error('Error creating new structure:', error);
        }
    }

    async createDirectory(item) {
        try {
            let parentHandle = this.projectHandle;

            if (item.parentId) {
                const parentItem = this.data.items[item.parentId];
                if (parentItem && parentItem.directoryHandle) {
                    parentHandle = parentItem.directoryHandle;
                }
            }

            const dirHandle = await parentHandle.getDirectoryHandle(item.name, { create: true });
            item.directoryHandle = dirHandle;

            console.log(`Created directory: ${item.name}`);
        } catch (error) {
            console.error(`Error creating directory ${item.name}:`, error);
        }
    }

    clearAllData() {
        if (confirm('Are you sure you want to clear all data? This cannot be undone.')) {
            localStorage.removeItem('documentation-data');
            this.data = this.getEmptyData();
            this.projectHandle = null;

            // Hide save button
            const saveBtn = document.getElementById('save-project-btn');
            if (saveBtn) {
                saveBtn.style.display = 'none';
            }

            this.renderSidebar();
            this.loadHomePage();
            console.log('All data cleared');
        }
    }
}

// Initialize the app
const app = new DocumentationApp();