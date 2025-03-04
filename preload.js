const XLSX = require('xlsx-style');
const path = require('path');
const fs = require('fs');

// Excel处理相关函数
window.excelUtils = {
  // 读取Excel文件
  readExcel(filePath) {
    try {
      const workbook = XLSX.readFile(filePath);
      return {
        success: true,
        data: {
          sheets: workbook.SheetNames,
          filePath,
          fileName: path.basename(filePath)
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  },

  // 获取工作表的列信息
  getSheetColumns(filePath, sheetName) {
    try {
      const workbook = XLSX.readFile(filePath);
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);
      
      if (jsonData.length === 0) {
        return {
          success: false,
          error: '工作表为空'
        };
      }

      // 获取第一行数据的所有列名
      const columns = Object.keys(jsonData[0]);
      
      return {
        success: true,
        data: columns
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  },

  // 按工作表拆分
  splitBySheets(filePath, outputDir) {
    try {
      // 使用完整的选项读取文件，以保留样式
      const workbook = XLSX.readFile(filePath, {
        cellStyles: true,
        cellNF: true,
        cellDates: true
      });
      
      const fileName = path.basename(filePath, path.extname(filePath));
      
      workbook.SheetNames.forEach(sheetName => {
        const newWorkbook = {
          SheetNames: [sheetName],
          Sheets: {
            [sheetName]: workbook.Sheets[sheetName]
          }
        };
        
        // 复制工作簿属性
        if (workbook.Workbook) {
          newWorkbook.Workbook = JSON.parse(JSON.stringify(workbook.Workbook));
        }
        
        const safeSheetName = sheetName.replace(/[\\/:*?"<>|]/g, '_');
        const outputPath = path.join(outputDir, `${fileName}_${safeSheetName}.xlsx`);
        
        // 使用完整的选项写入文件
        XLSX.writeFile(newWorkbook, outputPath, {
          bookSST: true,
          cellStyles: true,
          cellNF: true,
          cellDates: true
        });
      });

      return {
        success: true,
        message: `成功拆分为 ${workbook.SheetNames.length} 个文件`
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  },

  // 按内容拆分(根据指定列的值拆分)
  splitByContent(filePath, outputDir, options) {
    try {
      // 使用完整的选项读取文件，以保留样式
      const workbook = XLSX.readFile(filePath, {
        cellStyles: true,
        cellNF: true,
        cellDates: true
      });
      
      const fileName = path.basename(filePath, path.extname(filePath));
      const { sheetName, columnName } = options;
      
      const worksheet = workbook.Sheets[sheetName];
      
      // 获取工作表范围
      const range = XLSX.utils.decode_range(worksheet['!ref']);
      
      // 获取所有列名（第一行）
      const headers = [];
      for (let C = range.s.c; C <= range.e.c; C++) {
        const headerCell = worksheet[XLSX.utils.encode_cell({r: 0, c: C})];
        headers[C] = headerCell ? headerCell.v : '';
      }
      
      // 找到目标列的索引
      const columnIndex = headers.findIndex(h => h === columnName);
      if (columnIndex === -1) {
        throw new Error('未找到指定的列');
      }
      
      // 按指定列分组
      const groups = new Map();
      
      // 从第二行开始遍历数据（跳过表头）
      for (let R = range.s.r + 1; R <= range.e.r; R++) {
        // 获取当前行的分组键值
        const keyCell = worksheet[XLSX.utils.encode_cell({r: R, c: columnIndex})];
        if (!keyCell || !keyCell.v) continue;
        
        const key = keyCell.v;
        
        if (!groups.has(key)) {
          // 为这个key创建一个新的工作簿
          const newWorkbook = {
            SheetNames: [sheetName],
            Sheets: {
              [sheetName]: {
                '!ref': XLSX.utils.encode_range({
                  s: { r: 0, c: 0 },
                  e: { r: 0, c: range.e.c }
                })
              }
            }
          };
          
          // 复制表头
          for (let C = range.s.c; C <= range.e.c; C++) {
            const headerRef = XLSX.utils.encode_cell({r: 0, c: C});
            const headerCell = worksheet[headerRef];
            if (headerCell) {
              newWorkbook.Sheets[sheetName][headerRef] = JSON.parse(JSON.stringify(headerCell));
            }
          }
          
          // 复制工作表属性
          const newSheet = newWorkbook.Sheets[sheetName];
          if (worksheet['!cols']) newSheet['!cols'] = JSON.parse(JSON.stringify(worksheet['!cols']));
          if (worksheet['!rows']) newSheet['!rows'] = JSON.parse(JSON.stringify(worksheet['!rows']));
          if (worksheet['!margins']) newSheet['!margins'] = { ...worksheet['!margins'] };
          
          groups.set(key, {
            workbook: newWorkbook,
            currentRow: 1 // 从第1行开始（表头是第0行）
          });
        }
        
        // 获取当前组的信息
        const groupInfo = groups.get(key);
        const targetSheet = groupInfo.workbook.Sheets[sheetName];
        
        // 复制当前行的所有单元格
        for (let C = range.s.c; C <= range.e.c; C++) {
          const srcRef = XLSX.utils.encode_cell({r: R, c: C});
          const targetRef = XLSX.utils.encode_cell({r: groupInfo.currentRow, c: C});
          const srcCell = worksheet[srcRef];
          
          if (srcCell) {
            // 深度复制单元格，包括所有属性
            targetSheet[targetRef] = JSON.parse(JSON.stringify(srcCell));
          }
        }
        
        // 更新工作表范围
        targetSheet['!ref'] = XLSX.utils.encode_range({
          s: { r: 0, c: 0 },
          e: { r: groupInfo.currentRow, c: range.e.c }
        });
        
        // 递增当前组的行计数
        groupInfo.currentRow++;
      }
      
      if (groups.size === 0) {
        throw new Error('没有找到可拆分的数据');
      }
      
      // 保存所有分组的工作簿
      groups.forEach((groupInfo, key) => {
        const safeKey = String(key).replace(/[\\/:*?"<>|]/g, '_');
        const safeColumnName = columnName.replace(/[\\/:*?"<>|]/g, '_');
        const safeSheetName = sheetName.replace(/[\\/:*?"<>|]/g, '_');
        const outputPath = path.join(outputDir, `${fileName}_${safeSheetName}_${safeColumnName}_${safeKey}.xlsx`);
        
        // 使用完整的选项写入文件
        XLSX.writeFile(groupInfo.workbook, outputPath, {
          bookSST: true,
          cellStyles: true,
          cellNF: true,
          cellDates: true
        });
      });
      
      return {
        success: true,
        message: `成功拆分为 ${groups.size} 个文件`
      };
    } catch (error) {
      console.error('拆分错误:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
};

// 文件系统操作
window.fsUtils = {
  // 确保目录存在
  ensureDir(dir) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  },

  // 获取文件信息
  getFileInfo(filePath) {
    try {
      const stats = fs.statSync(filePath);
      return {
        size: stats.size,
        createTime: stats.birthtime,
        modifyTime: stats.mtime
      };
    } catch (error) {
      return null;
    }
  },

  // 获取文件目录路径
  getDirname(filePath) {
    return path.dirname(filePath);
  }
}; 