import React, { useEffect, useState } from 'react';
import { Settings, Database, Key, Globe, Save, Eye, EyeOff, Check, X } from 'lucide-react';
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
    attachmentLink:''
  });

  const handleChange = (field, value) => {
    setConfig(prev => ({ ...prev, [field]: value }));
    setSaved(false);
  };


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
        .order('id', { ascending: true })
        .limit(1); // fetch first row only

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
          attachmentLink:row.attachment_link
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
        .order('id', { ascending: true })
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
            attachment_link:config.attachmentLink
          })
          .eq('id', existing[0].id);

        if (updateError) {
          console.error('Error updating settings:', updateError);
          return;
        }
      }

      await fetch('http://localhost:8080/api/update-env', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerSource: config.customerSource })
        });

    
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
  return (
    <div className="no-scrollbar h-screen overflow-auto text-white p-6">
      <div className="max-w-5xl mx-auto flex flex-col min-h-full">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <Settings className="w-8 h-8 text-red-500" />
          <h1 className="text-3xl font-bold">System Settings</h1>
        </div>

        {/* Settings Card */}
        <div className="bg-[#1f2937] rounded-lg shadow-xl border border-gray-700 flex flex-col flex-1">
          
          {/* Section Header */}
          <div className="border-b border-gray-700 p-6 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold mb-1">Environment Configuration</h2>
              <p className="text-gray-400 text-sm">Configure your Supabase connection and data sources</p>
            </div>
            <button
              onClick={() => setShowKeys(!showKeys)}
              className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-md transition-colors"
            >
              {showKeys ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              {showKeys ? 'Hide' : 'Show'} Keys
            </button>
          </div>

          {/* Form Content */}
          <div className="p-6 space-y-6 flex-1 overflow-auto">
            {/* Supabase Project ID */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-300">
                <Database className="w-4 h-4 text-blue-400" />
                Supabase Project ID
              </label>
              <input
                type="text"
                value={config.projectId}
                onChange={(e) => handleChange('projectId', e.target.value)}
                className="w-full px-4 py-3 bg-[#374151] border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-white"
                placeholder="Enter project ID"
              />
              <p className="text-xs text-gray-500">Your Supabase project identifier</p>
            </div>

            {/* Supabase URL */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-300">
                <Globe className="w-4 h-4 text-green-400" />
                Supabase URL
              </label>
              <input
                type="text"
                value={config.url}
                onChange={(e) => handleChange('url', e.target.value)}
                className="w-full px-4 py-3 bg-[#374151] border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-white"
                placeholder="https://your-project.supabase.co"
              />
              <p className="text-xs text-gray-500">Your Supabase project URL</p>
            </div>

            {/* Publishable Key */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-300">
                <Key className="w-4 h-4 text-yellow-400" />
                Publishable Key (Anon)
              </label>
              <textarea
                value={showKeys ? config.publishableKey : maskKey(config.publishableKey)}
                onChange={(e) => handleChange('publishableKey', e.target.value)}
                rows={showKeys ? 4 : 2}
                className="w-full px-4 py-3 bg-[#374151] border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-white font-mono text-sm resize-none"
                placeholder="Enter publishable key"
              />
              <p className="text-xs text-gray-500">Your Supabase anon/public key (safe for client-side use)</p>
            </div>

            {/* Customer Source */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-300">
                <Database className="w-4 h-4 text-purple-400" />
                Customer Data Source
              </label>
              <select
                value={config.customerSource}
                onChange={(e) => handleChange('customerSource', e.target.value)}
                className="w-full px-4 py-3 bg-[#374151] border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-white cursor-pointer"
              >
                <option value="GSHEET">Google Sheets</option>
                <option value="PROD">Production Database</option>
              </select>
              <p className="text-xs text-gray-500">Select where customer data is sourced from</p>
            </div>

            {/* Attachment Drive ID */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-300">
                <Database className="w-4 h-4 text-blue-400" />
                Drive Attachment ID
              </label>
              <input
                type="text"
                value={config.attachmentLink}
                onChange={(e) => handleChange('attachmentLink', e.target.value)}
                className="w-full px-4 py-3 bg-[#374151] border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-white"
                placeholder="Enter project ID"
              />
              <p className="text-xs text-gray-500">Your Drive Attachment ID</p>
            </div>
          </div>

          {/* Footer Actions - sticky */}
          <div className="border-t border-gray-700 p-6 flex items-center justify-between bg-[#1a202c] sticky bottom-0">
            <div className="flex items-center gap-2">
              {saved && (
                <div className="flex items-center gap-2 text-green-400 animate-fade-in">
                  <Check className="w-5 h-5" />
                  <span className="text-sm font-medium">Configuration saved successfully</span>
                </div>
              )}
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setConfig({
                  projectId: '',
                  publishableKey: '',
                  url: '',
                  customerSource: 'GSHEET'
                })}
                className="flex items-center gap-2 px-5 py-2.5 bg-gray-700 hover:bg-gray-600 rounded-md transition-colors font-medium"
              >
                <X className="w-4 h-4" />
                Reset
              </button>
              <button
                onClick={handleSave}
                className="flex items-center gap-2 px-5 py-2.5 bg-red-600 hover:bg-red-700 rounded-md transition-colors font-medium shadow-lg"
              >
                <Save className="w-4 h-4" />
                Save Configuration
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
