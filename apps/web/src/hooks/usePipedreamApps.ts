/**
 * Pipedream Apps & Tools Hooks
 * Manages dynamic loading of Pipedream apps and actions for UI
 */

import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';

export interface PipedreamApp {
  id: string;
  name: string;
  icon?: string;
}

export interface PipedreamTool {
  name: string;
  key: string;
  description: string;
  inputSchema?: Record<string, any>;
  outputSchema?: Record<string, any>;
}

/**
 * Load list of available Pipedream apps
 * Supports search and pagination
 */
export const usePipedreamApps = (
  search?: string,
  limit: number = 100,
  offset: number = 0,
  enabled: boolean = true
) => {
  return useQuery({
    queryKey: ['pipedream-apps', search, limit, offset],
    queryFn: async () => {
      const response = await api.get('/skills/pipedream/apps', {
        params: { search, limit, offset }
      });
      return response.data as PipedreamApp[];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    enabled
  });
};

/**
 * Load available tools/actions for a specific app
 */
export const usePipedreamTools = (
  appSlug: string | null | undefined,
  enabled: boolean = true
) => {
  return useQuery({
    queryKey: ['pipedream-tools', appSlug],
    queryFn: async () => {
      if (!appSlug) throw new Error('appSlug is required');

      const response = await api.get('/skills/pipedream/tools', {
        params: { appSlug }
      });
      return response.data as PipedreamTool[];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    enabled: enabled && !!appSlug
  });
};

/**
 * Get input schema for a specific tool
 */
export const usePipedreamToolSchema = (
  appSlug: string | null | undefined,
  toolName: string | null | undefined
) => {
  const { data: tools } = usePipedreamTools(appSlug, !!appSlug && !!toolName);

  const tool = tools?.find(t => t.name === toolName);
  return tool?.inputSchema || null;
};

/**
 * Transform Pipedream tools to dropdown options
 */
export const transformToolsToOptions = (
  tools: PipedreamTool[] | undefined
) => {
  if (!tools) return [];

  return tools.map(tool => ({
    id: tool.name,
    label: tool.description || tool.name
  }));
};

/**
 * Transform Pipedream apps to dropdown options
 */
export const transformAppsToOptions = (
  apps: PipedreamApp[] | undefined
) => {
  if (!apps) return [];

  return apps.map(app => ({
    id: app.id,
    label: app.name,
    icon: app.icon
  }));
};
