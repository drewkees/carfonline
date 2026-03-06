import React, { useEffect, useState } from 'react';
import { Settings, Database, Key, Globe, Save, Eye, EyeOff, Check } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export default function SettingsUI() {
  const [showKeys, setShowKeys] = useState(false);
  const [saved, setSaved] = useState(false);
  const [config, setConfig] = useState({
    projectId: '',
    publishableKey: '',
    url: '',
    customerSource: 'PROD',
    attachmentLink: '',
    sheetId: '',
    sheetAPIkey: '',
    sheetRange: '',
    environment: 'production',
  });

  const handleChange = (field, value) => {
    setConfig((prev) => ({ ...prev, [field]: value }));
    setSaved(false);
  };

  const appEnv = import.meta.env.VITE_APP_ENV || 'production';

  const maskKey = (key) => {
    if (!showKeys && key.length > 20) {
      return key.substring(0, 10) + '•••••••••••••' + key.substring(key.length - 10);
    }
    return key;
  };

  const loadSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('system_settings')
        .select('*')
        .eq('environment', appEnv)
        .limit(1);

      if (error) {
        console.error('Error fetching settings:', error);
        return;
      }

      if (data && data.length > 0) {
        const row = data[0];
        setConfig({
          projectId: row.project_id,
          publishableKey: row.publishable_key,
          url: row.url,
          customerSource: row.customer_source,
          attachmentLink: row.attachment_link,
          sheetId: row.sheet_id,
          sheetAPIkey: row.sheet_apikey,
          sheetRange: row.sheet_range,
          environment: row.environment || 'production',
        });
      }
    } catch (err) {
      console.error('Unexpected error:', err);
    }
  };

  const handleSave = async () => {
    try {
      const { data: existing, error: fetchError } = await supabase
        .from('system_settings')
        .select('*')
        .eq('environment', appEnv)
        .limit(1);

      if (fetchError) {
        console.error('Error fetching existing settings:', fetchError);
        return;
      }

      if (existing && existing.length > 0) {
        const { error: updateError } = await supabase
          .from('system_settings')
          .update({
            project_id: config.projectId,
            publishable_key: config.publishableKey,
            url: config.url,
            customer_source: config.customerSource,
            attachment_link: config.attachmentLink,
            sheet_id: config.sheetId,
            sheet_apikey: config.sheetAPIkey,
            sheet_range: config.sheetRange,
            environment: config.environment,
          })
          .eq('id', existing[0].id);

        if (updateError) {
          console.error('Error updating settings:', updateError);
          return;
        }
      }

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      toast({
        title: 'Success',
        description: 'Configuration saved successfully!',
      });
    } catch (err) {
      console.error('Unexpected error:', err);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const fieldLabelClass = 'flex items-center gap-2 text-xs sm:text-sm font-medium text-gray-300';
  const fieldInputClass =
    'w-full px-3 py-2 sm:px-4 sm:py-3 bg-[#374151] border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-white text-sm sm:text-base';

  return (
    <div
      className="h-screen overflow-y-auto overflow-x-hidden custom-scrollbar text-white p-3 sm:p-6"
      style={{ overflowX: 'hidden' }}
    >
      <div className="w-full min-w-0 flex flex-col h-full">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4 sm:mb-6 shrink-0">
          <div className="flex items-center gap-2 sm:gap-3">
            <Settings className="w-6 h-6 sm:w-8 sm:h-8 text-red-500" />
            <h1 className="text-xl sm:text-3xl font-bold">System Settings</h1>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 sm:ml-auto">
            <button
              onClick={() => setShowKeys(!showKeys)}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-md transition-colors text-sm sm:text-base whitespace-nowrap"
            >
              {showKeys ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              {showKeys ? 'Hide' : 'Show'} Keys
            </button>
            <button
              onClick={handleSave}
              className="flex items-center justify-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 bg-red-600 hover:bg-red-700 rounded-md transition-colors font-medium shadow-lg text-sm sm:text-base"
            >
              <Save className="w-4 h-4" />
              Save Configuration
            </button>
          </div>
        </div>

        <div className="bg-[#1f2937] rounded-lg shadow-xl border border-gray-700 flex flex-col flex-1 min-h-0">
          <div className="border-b border-gray-700 p-4 sm:p-5 shrink-0">
            <div>
              <h2 className="text-base sm:text-lg font-semibold mb-0.5">Environment Configuration</h2>
              <p className="text-gray-400 text-[11px] sm:text-xs">Configure your Supabase connection and data sources</p>
            </div>
          </div>

          {saved && (
            <div className="border-b border-gray-700 p-3 sm:p-4 bg-[#1a202c] shrink-0">
              <div className="flex items-center justify-center gap-2 text-green-400 animate-fade-in">
                <Check className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="text-xs sm:text-sm font-medium">Configuration saved successfully</span>
              </div>
            </div>
          )}

          <div
            className="p-4 sm:p-6 overflow-y-auto overflow-x-hidden custom-scrollbar flex-1 min-h-0"
            style={{ overflowX: 'hidden' }}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              <div className="space-y-2">
                <label className={fieldLabelClass}>
                  <Database className="w-4 h-4 text-blue-400" />
                  Supabase Project ID
                </label>
                <input
                  type="text"
                  value={config.projectId}
                  onChange={(e) => handleChange('projectId', e.target.value)}
                  className={fieldInputClass}
                  placeholder="Enter project ID"
                />
                <p className="text-xs text-gray-500">Your Supabase project identifier</p>
              </div>

              <div className="space-y-2">
                <label className={fieldLabelClass}>
                  <Globe className="w-4 h-4 text-green-400" />
                  Supabase URL
                </label>
                <input
                  type="text"
                  value={config.url}
                  onChange={(e) => handleChange('url', e.target.value)}
                  className={fieldInputClass}
                  placeholder="https://your-project.supabase.co"
                />
                <p className="text-xs text-gray-500">Your Supabase project URL</p>
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className={fieldLabelClass}>
                  <Key className="w-4 h-4 text-yellow-400" />
                  Publishable Key (Anon)
                </label>
                <textarea
                  value={showKeys ? config.publishableKey : maskKey(config.publishableKey)}
                  onChange={(e) => handleChange('publishableKey', e.target.value)}
                  rows={showKeys ? 4 : 2}
                  className="w-full px-3 py-2 sm:px-4 sm:py-3 bg-[#374151] border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-white font-mono text-xs sm:text-sm resize-none"
                  placeholder="Enter publishable key"
                />
                <p className="text-xs text-gray-500">Your Supabase anon/public key (safe for client-side use)</p>
              </div>

              <div className="space-y-2">
                <label className={fieldLabelClass}>
                  <Database className="w-4 h-4 text-purple-400" />
                  Customer Data Source
                </label>
                <select
                  value={config.customerSource}
                  onChange={(e) => handleChange('customerSource', e.target.value)}
                  className={fieldInputClass + ' cursor-pointer'}
                >
                  <option value="GSHEET">Google Sheets</option>
                  <option value="PROD">Production Database</option>
                </select>
                <p className="text-xs text-gray-500">Select where customer data is sourced from</p>
              </div>

              <div className="space-y-2">
                <label className={fieldLabelClass}>
                  <Globe className="w-4 h-4 text-orange-400" />
                  Environment
                </label>
                <select
                  value={config.environment}
                  onChange={(e) => handleChange('environment', e.target.value)}
                  className={fieldInputClass + ' cursor-pointer'}
                >
                  <option value="production">Production</option>
                  <option value="preprod">Pre-Production</option>
                </select>
                <p className="text-xs text-gray-500">Select the environment for this configuration</p>
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className={fieldLabelClass}>
                  <Database className="w-4 h-4 text-blue-400" />
                  Drive Attachment ID
                </label>
                <input
                  type="text"
                  value={config.attachmentLink}
                  onChange={(e) => handleChange('attachmentLink', e.target.value)}
                  className={fieldInputClass}
                  placeholder="Enter Drive Attachment ID"
                />
                <p className="text-xs text-gray-500">Your Drive Attachment ID</p>
              </div>

              <div className="md:col-span-2 p-3 sm:p-4 rounded-lg border border-blue-500 bg-blue-900/30">
                <h3 className="text-base sm:text-lg font-semibold text-blue-300 mb-4">Google Sheet Configuration</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-xs sm:text-sm font-medium text-blue-300">
                      <Database className="w-4 h-4 text-blue-400" />
                      Google Sheet ID
                    </label>
                    <input
                      type="text"
                      value={config.sheetId}
                      onChange={(e) => handleChange('sheetId', e.target.value)}
                      className={fieldInputClass}
                      placeholder="Enter Google Sheet ID"
                    />
                    <p className="text-xs text-gray-500">Your Google Sheet ID</p>
                  </div>

                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-xs sm:text-sm font-medium text-blue-300">
                      <Key className="w-4 h-4 text-yellow-400" />
                      Google Sheet API Key
                    </label>
                    <input
                      type="text"
                      value={config.sheetAPIkey}
                      onChange={(e) => handleChange('sheetAPIkey', e.target.value)}
                      className={fieldInputClass}
                      placeholder="Enter Google Sheet API Key"
                    />
                    <p className="text-xs text-gray-500">Your Google Sheet API Key</p>
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <label className="flex items-center gap-2 text-xs sm:text-sm font-medium text-blue-300">
                      <Database className="w-4 h-4 text-green-400" />
                      Google Sheet Range
                    </label>
                    <input
                      type="text"
                      value={config.sheetRange}
                      onChange={(e) => handleChange('sheetRange', e.target.value)}
                      className={fieldInputClass}
                      placeholder="Example: A2:G500"
                    />
                    <p className="text-xs text-gray-500">Your Google Sheet Range</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
