// Type guards for language skills
export const isPerLanguageFormat = (languageSkills) => {
    return languageSkills &&
        typeof languageSkills === 'object' &&
        'languages' in languageSkills &&
        Array.isArray(languageSkills.languages) &&
        languageSkills.languages.length > 0 &&
        typeof languageSkills.languages[0] === 'object' &&
        languageSkills.languages[0] !== null &&
        'language' in languageSkills.languages[0];
};
export const isLegacyFormat = (languageSkills) => {
    return languageSkills &&
        typeof languageSkills === 'object' &&
        'fluency' in languageSkills &&
        'languages' in languageSkills &&
        Array.isArray(languageSkills.languages) &&
        languageSkills.languages.length > 0 &&
        typeof languageSkills.languages[0] === 'string';
};
// Utility functions for working with language skills
export const getLanguageFluency = (languageSkills, language = 'English') => {
    if (!languageSkills) {
        return 'native';
    }
    if (isPerLanguageFormat(languageSkills)) {
        const lang = languageSkills.languages.find(l => l.language.toLowerCase() === language.toLowerCase());
        return lang?.fluency || 'native';
    }
    else if (isLegacyFormat(languageSkills)) {
        return languageSkills.fluency;
    }
    // Fallback for malformed data
    return 'native';
};
export const getAllLanguages = (languageSkills) => {
    if (!languageSkills) {
        return ['English'];
    }
    if (isPerLanguageFormat(languageSkills)) {
        const languages = languageSkills.languages.map(l => l.language);
        // Safety check: if no languages, return English
        return languages.length > 0 ? languages : ['English'];
    }
    else if (isLegacyFormat(languageSkills)) {
        // Safety check: if no languages, return English
        return languageSkills.languages.length > 0 ? languageSkills.languages : ['English'];
    }
    // Fallback for malformed data - try to extract languages if possible
    if (languageSkills && typeof languageSkills === 'object' && 'languages' in languageSkills) {
        const languages = languageSkills.languages;
        if (Array.isArray(languages)) {
            const filtered = languages.filter(lang => typeof lang === 'string');
            return filtered.length > 0 ? filtered : ['English'];
        }
    }
    return ['English'];
};
export const getLanguageAccent = (languageSkills, language = 'English') => {
    if (!languageSkills) {
        return '';
    }
    if (isPerLanguageFormat(languageSkills)) {
        const lang = languageSkills.languages.find(l => l.language.toLowerCase() === language.toLowerCase());
        return lang?.accent || '';
    }
    else if (isLegacyFormat(languageSkills)) {
        return languageSkills.accent || '';
    }
    // Fallback for malformed data
    return '';
};
// Channel operator utility functions
export const isChannelOperator = (channel, nickname) => {
    return (channel.operators || []).includes(nickname);
};
export const addChannelOperator = (channel, nickname) => {
    const operators = channel.operators || [];
    if (!operators.includes(nickname)) {
        return {
            ...channel,
            operators: [...operators, nickname]
        };
    }
    return channel;
};
export const removeChannelOperator = (channel, nickname) => {
    const operators = channel.operators || [];
    return {
        ...channel,
        operators: operators.filter(op => op !== nickname)
    };
};
export const canUserPerformAction = (channel, nickname, action) => {
    return isChannelOperator(channel, nickname);
};
// Migration functions for enhanced writing style attributes
export const migrateWritingStyle = (oldStyle) => {
    if (!oldStyle || typeof oldStyle !== 'object') {
        return {
            formality: 'semi_formal',
            verbosity: 'moderate',
            humor: 'none',
            emojiUsage: 'rare',
            punctuation: 'standard'
        };
    }
    // Map old formality values to new ones
    const formalityMap = {
        'very_informal': 'ultra_casual',
        'informal': 'very_casual',
        'neutral': 'semi_formal',
        'formal': 'formal',
        'very_formal': 'very_formal'
    };
    // Map old verbosity values to new ones
    const verbosityMap = {
        'very_terse': 'terse',
        'terse': 'brief',
        'neutral': 'moderate',
        'verbose': 'detailed',
        'very_verbose': 'verbose'
    };
    // Map old humor values to new ones
    const humorMap = {
        'none': 'none',
        'dry': 'dry',
        'sarcastic': 'sarcastic',
        'witty': 'witty',
        'slapstick': 'moderate'
    };
    // Map old emoji usage values to new ones
    const emojiUsageMap = {
        'none': 'none',
        'low': 'rare',
        'medium': 'occasional',
        'high': 'frequent',
        'excessive': 'excessive'
    };
    // Map old punctuation values to new ones
    const punctuationMap = {
        'minimal': 'minimal',
        'standard': 'standard',
        'creative': 'expressive',
        'excessive': 'dramatic'
    };
    return {
        formality: formalityMap[oldStyle.formality] || 'semi_formal',
        verbosity: verbosityMap[oldStyle.verbosity] || 'moderate',
        humor: humorMap[oldStyle.humor] || 'none',
        emojiUsage: emojiUsageMap[oldStyle.emojiUsage] || 'rare',
        punctuation: punctuationMap[oldStyle.punctuation] || 'standard'
    };
};
// Helper function to safely get writing style with migration
export const getWritingStyle = (user) => {
    if (!user.writingStyle) {
        return {
            formality: 'semi_formal',
            verbosity: 'moderate',
            humor: 'none',
            emojiUsage: 'rare',
            punctuation: 'standard'
        };
    }
    // Check if this is an old format that needs migration
    const oldFormalityValues = ['very_informal', 'informal', 'neutral', 'formal', 'very_formal'];
    const oldVerbosityValues = ['very_terse', 'terse', 'neutral', 'verbose', 'very_verbose'];
    const oldHumorValues = ['none', 'dry', 'sarcastic', 'witty', 'slapstick'];
    const oldEmojiValues = ['none', 'low', 'medium', 'high', 'excessive'];
    const oldPunctuationValues = ['minimal', 'standard', 'creative', 'excessive'];
    const needsMigration = oldFormalityValues.includes(user.writingStyle.formality) ||
        oldVerbosityValues.includes(user.writingStyle.verbosity) ||
        oldHumorValues.includes(user.writingStyle.humor) ||
        oldEmojiValues.includes(user.writingStyle.emojiUsage) ||
        oldPunctuationValues.includes(user.writingStyle.punctuation);
    if (needsMigration) {
        return migrateWritingStyle(user.writingStyle);
    }
    return user.writingStyle;
};
