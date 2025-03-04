// 全局状态
const state = {
    files: new Map(), // 存储添加的文件信息
    outputDir: '', // 输出目录
    splitType: 'sheet', // 拆分方式：'sheet' 或 'content'
    selectedSheet: '', // 选中的工作表
    selectedColumn: '', // 选中的列名
};

// 用户配置管理
const userConfig = {
    // 保存用户配置
    save() {
        utools.dbStorage.setItem('excel-splitter-config', {
            splitType: state.splitType
        });
    },

    // 加载用户配置
    load() {
        const config = utools.dbStorage.getItem('excel-splitter-config');
        if (config) {
            state.splitType = config.splitType || 'sheet';
            // 更新UI
            const radio = document.querySelector(`input[name="splitType"][value="${state.splitType}"]`);
            if (radio) {
                radio.checked = true;
                elements.contentSettings.style.display = state.splitType === 'content' ? 'block' : 'none';
            }
        }
    }
};

// 消息提示控制
const message = {
    container: document.getElementById('messageContainer'),
    show(text, type = 'info', duration = 3000) {
        const id = Date.now();
        const messageEl = document.createElement('div');
        messageEl.className = `message ${type}`;
        messageEl.innerHTML = `
            ${text}
            <span class="close">×</span>
        `;
        
        // 添加关闭按钮事件
        const closeBtn = messageEl.querySelector('.close');
        closeBtn.addEventListener('click', () => this.close(messageEl));
        
        this.container.appendChild(messageEl);
        
        // 触发重排以启动动画
        messageEl.offsetHeight;
        messageEl.classList.add('show');
        
        // 自动关闭
        if (duration > 0) {
            setTimeout(() => {
                this.close(messageEl);
            }, duration);
        }
        
        return id;
    },
    
    info(text, duration) {
        return this.show(text, 'info', duration);
    },
    
    success(text, duration) {
        return this.show(text, 'success', duration);
    },
    
    warning(text, duration) {
        return this.show(text, 'warning', duration);
    },
    
    error(text, duration) {
        return this.show(text, 'error', duration);
    },
    
    close(messageEl) {
        messageEl.classList.remove('show');
        messageEl.addEventListener('transitionend', () => {
            messageEl.remove();
        });
    }
};

// DOM 元素
const elements = {
    addFiles: document.getElementById('addFiles'),
    fileList: document.getElementById('fileList'),
    outputDir: document.getElementById('outputDir'),
    selectOutputDir: document.getElementById('selectOutputDir'),
    startSplit: document.getElementById('startSplit'),
    contentSettings: document.getElementById('contentSettings'),
    sheetSelect: document.getElementById('sheetSelect'),
    columnSelect: document.getElementById('columnSelect'),
    progressContainer: document.getElementById('progressContainer'),
    progressBar: document.getElementById('progressBar'),
    progressText: document.getElementById('progressText')
};

// 事件处理函数
function handleAddFiles() {
    const files = utools.showOpenDialog({
        filters: [{ name: 'Excel Files', extensions: ['xlsx', 'xls'] }],
        properties: ['openFile', 'multiSelections']
    });

    if (files && files.length > 0) {
        // 自动设置输出目录为第一个文件的所在目录
        const firstFilePath = files[0];
        const outputDir = window.fsUtils.getDirname(firstFilePath);
        state.outputDir = outputDir;
        elements.outputDir.value = outputDir;

        files.forEach(filePath => {
            const result = window.excelUtils.readExcel(filePath);
            if (result.success) {
                state.files.set(filePath, result.data);
                updateFileList();
                updateSheetSelect();
            } else {
                message.error(`文件读取失败: ${result.error}`);
            }
        });
        
        updateStartButton();
    }
}

function handleSelectOutputDir() {
    const result = utools.showOpenDialog({
        properties: ['openDirectory']
    });

    if (result && result[0]) {
        state.outputDir = result[0];
        elements.outputDir.value = state.outputDir;
        updateStartButton();
    }
}

function handleSplitTypeChange(event) {
    state.splitType = event.target.value;
    elements.contentSettings.style.display = state.splitType === 'content' ? 'block' : 'none';
    updateStartButton();
    // 保存用户选择
    userConfig.save();
}

function handleSheetChange(event) {
    state.selectedSheet = event.target.value;
    updateColumnSelect();
}

function handleColumnChange(event) {
    state.selectedColumn = event.target.value;
}

function handleStartSplit() {
    if (!validateSettings()) return;

    elements.progressContainer.style.display = 'block';
    elements.startSplit.disabled = true;

    const totalFiles = state.files.size;
    let processedFiles = 0;

    state.files.forEach((fileInfo, filePath) => {
        try {
            const result = state.splitType === 'sheet'
                ? window.excelUtils.splitBySheets(filePath, state.outputDir)
                : window.excelUtils.splitByContent(filePath, state.outputDir, {
                    sheetName: state.selectedSheet,
                    columnName: state.selectedColumn
                });

            if (result.success) {
                message.success(`文件 ${fileInfo.fileName} ${result.message}`);
            } else {
                message.error(`文件 ${fileInfo.fileName} 处理失败: ${result.error}`);
            }
        } catch (error) {
            message.error(`文件 ${fileInfo.fileName} 处理出错: ${error.message}`);
        }

        processedFiles++;
        updateProgress(processedFiles / totalFiles);
    });

    elements.startSplit.disabled = false;
    setTimeout(() => {
        elements.progressContainer.style.display = 'none';
        resetProgress();
        // 打开输出文件夹
        utools.shellOpenPath(state.outputDir);
    }, 2000);
}

// 辅助函数
function updateFileList() {
    elements.fileList.innerHTML = '';
    
    if (state.files.size === 0) {
        elements.fileList.innerHTML = `
            <div class="empty-state">
                <p>暂无文件</p>
                <p class="tip">点击"添加文件"按钮开始上传Excel文件</p>
            </div>
        `;
    } else {
        state.files.forEach((fileInfo, filePath) => {
            const fileItem = document.createElement('div');
            fileItem.className = 'file-item';
            
            const fileStats = window.fsUtils.getFileInfo(filePath);
            const size = formatFileSize(fileStats.size);
            
            fileItem.innerHTML = `
                <div class="file-info">
                    <div class="file-name">${fileInfo.fileName}</div>
                    <div class="file-meta">
                        <span>大小: ${size}</span>
                        <span>工作表数: ${fileInfo.sheets.length}</span>
                    </div>
                </div>
                <button class="btn" data-path="${filePath}">删除</button>
            `;

            // 为删除按钮添加事件监听器
            const deleteButton = fileItem.querySelector('.btn');
            deleteButton.addEventListener('click', () => {
                state.files.delete(filePath);
                updateFileList();
                updateSheetSelect();
            });
            
            elements.fileList.appendChild(fileItem);
        });
    }
    
    updateStartButton();
}

function updateSheetSelect() {
    elements.sheetSelect.innerHTML = '';
    if (state.files.size > 0) {
        const firstFile = state.files.values().next().value;
        firstFile.sheets.forEach(sheet => {
            const option = document.createElement('option');
            option.value = sheet;
            option.textContent = sheet;
            elements.sheetSelect.appendChild(option);
        });
        state.selectedSheet = firstFile.sheets[0];
        updateColumnSelect();
    }
}

function updateColumnSelect() {
    elements.columnSelect.innerHTML = '';
    if (state.files.size > 0 && state.selectedSheet) {
        const firstFile = state.files.values().next().value;
        const result = window.excelUtils.getSheetColumns(firstFile.filePath, state.selectedSheet);
        
        if (result.success) {
            result.data.forEach(column => {
                const option = document.createElement('option');
                option.value = column;
                option.textContent = column;
                elements.columnSelect.appendChild(option);
            });
            state.selectedColumn = result.data[0];
        } else {
            message.error(`获取列信息失败: ${result.error}`);
        }
    }
}

function updateStartButton() {
    elements.startSplit.disabled = state.files.size === 0 || !state.outputDir || 
        (state.splitType === 'content' && (!state.selectedSheet || !state.selectedColumn));
}

function updateProgress(percent) {
    elements.progressBar.style.width = `${percent * 100}%`;
    elements.progressText.textContent = `处理进度: ${Math.round(percent * 100)}%`;
}

function resetProgress() {
    elements.progressBar.style.width = '0%';
    elements.progressText.textContent = '处理中...';
}

function validateSettings() {
    if (state.files.size === 0) {
        message.warning('请先添加Excel文件');
        return false;
    }

    if (!state.outputDir) {
        message.warning('请选择输出目录');
        return false;
    }

    if (state.splitType === 'content') {
        if (!state.selectedSheet) {
            message.warning('请选择要拆分的工作表');
            return false;
        }
        if (!state.selectedColumn) {
            message.warning('请选择要拆分的列');
            return false;
        }
    }

    return true;
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return (bytes / Math.pow(k, i)).toFixed(2) + ' ' + sizes[i];
}

// 绑定事件
elements.addFiles.addEventListener('click', handleAddFiles);
elements.selectOutputDir.addEventListener('click', handleSelectOutputDir);
elements.startSplit.addEventListener('click', handleStartSplit);
elements.sheetSelect.addEventListener('change', handleSheetChange);
elements.columnSelect.addEventListener('change', handleColumnChange);
document.querySelectorAll('input[name="splitType"]').forEach(radio => {
    radio.addEventListener('change', handleSplitTypeChange);
});

// 插件入口处理
window.exports = {
    'excel-splitter': {
        mode: 'none',
        args: {
            enter: (action) => {
                // 加载用户配置
                userConfig.load();
                
                // 如果是通过文件拖拽进入
                if (action.type === 'files') {
                    const files = action.payload;
                    files.forEach(file => {
                        const result = window.excelUtils.readExcel(file.path);
                        if (result.success) {
                            state.files.set(file.path, result.data);
                        }
                    });
                    updateFileList();
                    updateSheetSelect();
                }
            }
        }
    }
}; 