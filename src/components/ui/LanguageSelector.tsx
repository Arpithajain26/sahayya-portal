import React from 'react';
import i18n from '../../i18n';

const LanguageSelector: React.FC = () => {
  const change = (e: React.ChangeEvent<HTMLSelectElement>) => {
    i18n.changeLanguage(e.target.value);
  };
  return (
    <div className="ml-auto">
      <label className="sr-only">Language</label>
      <select onChange={change} defaultValue={i18n.language} className="border rounded px-2 py-1">
        <option value="en">English</option>
        <option value="hi">हिन्दी</option>
        <option value="te">తెలుగు</option>
        <option value="kn">ಕನ್ನಡ</option>
      </select>
    </div>
  );
};

export default LanguageSelector;
