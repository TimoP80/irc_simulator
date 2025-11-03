import { AppConfig, User, Channel } from '../types.ts';
import { exportUsersToCSV, importUsersFromCSV, exportUsersToJSON, importUsersFromJSON } from './userImportExport.ts';
import { exportChannelsToJSON, importChannelsFromJSON, exportChannelToHTML, exportAllChannelsToHTML } from './channelImportExport.ts';

export const exportFullConfig = (config: AppConfig): string => {
  return JSON.stringify(config, null, 2);
};

export const importFullConfig = (jsonContent: string): Partial<AppConfig> => {
  try {
    const data = JSON.parse(jsonContent);
    return data as Partial<AppConfig>;
  } catch (error) {
    console.error('Failed to parse full config JSON:', error);
    throw new Error('Invalid JSON file format.');
  }
};

export const downloadFile = (content: string, filename: string, mimeType: string) => {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const readFileAsText = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        resolve(e.target.result as string);
      } else {
        reject(new Error('Failed to read file'));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
};

export { exportUsersToCSV, importUsersFromCSV, exportUsersToJSON, importUsersFromJSON, exportChannelsToJSON, importChannelsFromJSON, exportChannelToHTML, exportAllChannelsToHTML };
