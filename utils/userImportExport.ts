import type { User } from '../types';
import { isPerLanguageFormat, isLegacyFormat } from '../types';

// Helper function to parse CSV line properly handling quoted fields
const parseCSVLine = (line: string): string[] => {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        // Escaped quote
        current += '"';
        i++; // Skip next quote
      } else {
        // Toggle quote state
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      // End of field
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  
  // Add the last field
  result.push(current.trim());
  
  return result;
};

export interface UserExportData {
  nickname: string;
  personality: string;
  fluency: string;
  languages: string;
  accent: string;
  formality: string;
  verbosity: string;
  humor: string;
  emojiUsage: string;
  punctuation: string;
}

export const exportUsersToCSV = (users: User[]): string => {
  const headers = [
    'nickname',
    'personality',
    'languages',
    'formality',
    'verbosity',
    'humor',
    'emojiUsage',
    'punctuation'
  ];

  const csvContent = [
    headers.join(','),
    ...users.map(user => {
      // Handle both legacy and per-language formats
      let languagesString = '';
      if (isPerLanguageFormat(user.languageSkills)) {
        languagesString = user.languageSkills.languages.map(lang => `${lang.language}:${lang.fluency}:${lang.accent || ''}`).join(';');
      } else if (isLegacyFormat(user.languageSkills)) {
        languagesString = (user.languageSkills.languages as any).map((lang: any) => `${lang}:${(user.languageSkills as any).fluency || 'native'}:${(user.languageSkills as any).accent || ''}`).join(';');
      } else {
        languagesString = 'English:native:';
      }

      return [
        `"${user.nickname}"`,
        `"${user.personality}"`,
        `"${languagesString}"`,
        `"${user.writingStyle.formality}"`,
        `"${user.writingStyle.verbosity}"`,
        `"${user.writingStyle.humor}"`,
        `"${user.writingStyle.emojiUsage}"`,
        `"${user.writingStyle.punctuation}"`
      ].join(',');
    })
  ].join('\n');

  return csvContent;
};

export const importUsersFromCSV = (csvContent: string): User[] => {
  const lines = csvContent.split('\n').filter(line => line.trim());
  
  if (lines.length < 2) return [];

  // Parse CSV header
  const headers = parseCSVLine(lines[0]);
  
  const users: User[] = [];
  
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    
    if (values.length < headers.length) continue;

    // Parse languages from the new format: "English:native:accent;Finnish:advanced:"
    const languagesString = values[2] || 'English:native:';
    const languageEntries = languagesString.split(';').filter(l => l.trim());
    
    const languages = languageEntries.map(langEntry => {
      const parts = langEntry.split(':');
      return {
        language: parts[0] || 'English',
        fluency: parts[1] || 'native',
        accent: parts[2] || ''
      };
    });

    // Validate and set default values for all required properties
    const user: User = {
      nickname: values[0] || `user${i}`,
      status: 'online',
      userType: 'virtual',
      personality: values[1] || 'Imported user',
      languageSkills: {
        languages: languages.length > 0 ? languages.map(l => ({...l, fluency: l.fluency as any})) : [{ language: 'English', fluency: 'native', accent: '' }]
      },
      writingStyle: {
        formality: (values[3] as any) || 'semi_formal',
        verbosity: (values[4] as any) || 'moderate',
        humor: (values[5] as any) || 'none',
        emojiUsage: (values[6] as any) || 'rare',
        punctuation: (values[7] as any) || 'standard'
      }
    };

    // Validate that all required properties are properly set
    if (!user.languageSkills) {
      user.languageSkills = {
        languages: [{ language: 'English', fluency: 'native', accent: '' }]
      };
    }
    
    if (!user.writingStyle) {
      user.writingStyle = {
        formality: 'semi_formal',
        verbosity: 'moderate',
        humor: 'none',
        emojiUsage: 'rare',
        punctuation: 'standard'
      };
    }

    users.push(user);
  }

  return users;
};

export const exportUsersToJSON = (users: User[]): string => {
  return JSON.stringify(users, null, 2);
};

export const importUsersFromJSON = (jsonContent: string): User[] => {
  try {
    const data = JSON.parse(jsonContent);
    
    if (Array.isArray(data)) {
      return data.map(user => {
        // Handle different languageSkills formats from World Editor
        let languageSkills: User['languageSkills'];
        
        if (Array.isArray(user.languageSkills)) {
          // World Editor format: array of {language, fluency, accent} objects
          languageSkills = {
            languages: user.languageSkills.map((lang: any) => ({
              language: lang.language || 'English',
              fluency: (lang.fluency || 'native').toLowerCase(),
              accent: lang.accent || ''
            }))
          };
        } else if (user.languageSkills && typeof user.languageSkills === 'object') {
          // Check if it's already in per-language format
          if (isPerLanguageFormat(user.languageSkills)) {
            languageSkills = user.languageSkills;
          } else if (isLegacyFormat(user.languageSkills)) {
            // Convert legacy format to per-language format
            languageSkills = {
              languages: user.languageSkills.languages.map((lang: any) => ({
                language: lang,
                fluency: user.languageSkills.fluency,
                accent: user.languageSkills.accent || ''
              }))
            };
          } else {
            // Handle malformed data - try to extract what we can
            const languages = (user.languageSkills as any).languages;
            if (Array.isArray(languages) && languages.length > 0) {
              // If languages is an array of strings, convert to per-language format
              if (typeof languages[0] === 'string') {
                languageSkills = {
                  languages: languages.map((lang: string) => ({
                    language: lang,
                    fluency: 'native' as const,
                    accent: ''
                  }))
                };
              } else {
                // Default fallback
                languageSkills = {
                  languages: [{
                    language: 'English',
                    fluency: 'native',
                    accent: ''
                  }]
                };
              }
            } else {
              // Default fallback
              languageSkills = {
                languages: [{
                  language: 'English',
                  fluency: 'native',
                  accent: ''
                }]
              };
            }
          }
        } else {
          // Default fallback
          languageSkills = {
            languages: [{
              language: 'English',
              fluency: 'native',
              accent: ''
            }]
          };
        }

        // Handle different writingStyle formats
        let writingStyle: { formality: string; verbosity: string; humor: string; emojiUsage: string; punctuation: string };
        
        if (user.writingStyle && typeof user.writingStyle === 'object') {
          // Check if it's already in Station V format (snake_case values)
          const isStationVFormat = (value: string) => {
            return ['very_informal', 'informal', 'neutral', 'formal', 'very_formal',
                   'very_terse', 'terse', 'verbose', 'very_verbose',
                   'none', 'dry', 'sarcastic', 'witty', 'slapstick',
                   'low', 'medium', 'high', 'excessive',
                   'minimal', 'standard', 'creative'].includes(value);
          };

          // Convert World Editor format to Station V format
          const convertFormality = (formality: string) => {
            if (isStationVFormat(formality)) return formality;
            const mapping: { [key: string]: string } = {
              'Very Informal': 'very_informal',
              'Informal': 'informal',
              'Neutral': 'neutral',
              'Formal': 'formal',
              'Very Formal': 'very_formal'
            };
            return mapping[formality] || 'neutral';
          };

          const convertVerbosity = (verbosity: string) => {
            if (isStationVFormat(verbosity)) return verbosity;
            const mapping: { [key: string]: string } = {
              'Very Terse': 'very_terse',
              'Terse': 'terse',
              'Neutral': 'neutral',
              'Verbose': 'verbose',
              'Very Verbose': 'very_verbose'
            };
            return mapping[verbosity] || 'neutral';
          };

          const convertHumor = (humor: string) => {
            if (isStationVFormat(humor)) return humor;
            const mapping: { [key: string]: string } = {
              'None': 'none',
              'Dry': 'dry',
              'Sarcastic': 'sarcastic',
              'Witty': 'witty',
              'Slapstick': 'slapstick'
            };
            return mapping[humor] || 'none';
          };

          const convertEmojiUsage = (emojiUsage: string) => {
            if (isStationVFormat(emojiUsage)) return emojiUsage;
            const mapping: { [key: string]: string } = {
              'None': 'none',
              'Low': 'low',
              'Medium': 'medium',
              'High': 'high',
              'Excessive': 'excessive'
            };
            return mapping[emojiUsage] || 'low';
          };

          const convertPunctuation = (punctuation: string) => {
            if (isStationVFormat(punctuation)) return punctuation;
            const mapping: { [key: string]: string } = {
              'Minimal': 'minimal',
              'Standard': 'standard',
              'Creative': 'creative',
              'Excessive': 'excessive'
            };
            return mapping[punctuation] || 'standard';
          };

          writingStyle = {
            formality: convertFormality(user.writingStyle.formality || 'semi_formal'),
            verbosity: convertVerbosity(user.writingStyle.verbosity || 'moderate'),
            humor: convertHumor(user.writingStyle.humor || 'none'),
            emojiUsage: convertEmojiUsage(user.writingStyle.emojiUsage || 'rare'),
            punctuation: convertPunctuation(user.writingStyle.punctuation || 'standard')
          };
        } else {
          // Default fallback
          writingStyle = {
            formality: 'semi_formal',
            verbosity: 'moderate',
            humor: 'none',
            emojiUsage: 'rare',
            punctuation: 'standard'
          };
        }

        // Ensure all required properties exist with defaults
        const importedUser: User = {
          nickname: user.nickname || `user${Math.random().toString(36).substr(2, 9)}`,
          status: 'online' as const,
          userType: 'virtual',
          personality: user.personality || 'Imported user',
          languageSkills,
          writingStyle: writingStyle as any
        };

        return importedUser;
      });
    }
    
    return [];
  } catch (error) {
    console.error('Failed to parse JSON:', error);
    return [];
  }
};