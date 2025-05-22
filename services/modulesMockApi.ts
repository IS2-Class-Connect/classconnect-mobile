// mockModulesApi.ts
import { v4 as uuidv4 } from 'uuid';

export type Module = {
  id: string;
  title: string;
  description: string;
  order: number;
  id_course: number;
  resources: ModuleResource[];
};

export type ModuleResource = {
  link: string;
  data_type: 'image' | 'video' | 'link';
  module_id: string;
  order: number;
};

let modules: Module[] = [];

// === MODULES ===

export function createModule(data: Omit<Module, 'id' | 'resources'>): Module {
  const newModule: Module = {
    ...data,
    id: uuidv4(),
    resources: [],
  };
  modules.push(newModule);
  return newModule;
}

export function deleteModule(id: string): boolean {
  const initialLength = modules.length;
  modules = modules.filter((m) => m.id !== id);
  return modules.length < initialLength;
}

export function patchModule(
  id: string,
  data: Partial<Pick<Module, 'title' | 'description' | 'order'>>
): Module | null {
  const module = modules.find((m) => m.id === id);
  if (!module) return null;
  Object.assign(module, data);
  return module;
}

export function getModulesByCourse(courseId: number): Module[] {
  return modules.filter((m) => m.id_course === courseId);
}

// === RESOURCES ===

export function addResource(
  moduleId: string,
  resource: Omit<ModuleResource, 'module_id'>
): ModuleResource | null {
  const module = modules.find((m) => m.id === moduleId);
  if (!module) return null;
  const newResource: ModuleResource = {
    ...resource,
    module_id: moduleId,
  };
  module.resources.push(newResource);
  return newResource;
}

export function deleteResource(moduleId: string, link: string): boolean {
  const module = modules.find((m) => m.id === moduleId);
  if (!module) return false;
  const initialLength = module.resources.length;
  module.resources = module.resources.filter((r) => r.link !== link);
  return module.resources.length < initialLength;
}

export function patchResourceOrder(
  moduleId: string,
  link: string,
  newOrder: number
): ModuleResource | null {
  const module = modules.find((m) => m.id === moduleId);
  if (!module) return null;
  const resource = module.resources.find((r) => r.link === link);
  if (!resource) return null;
  resource.order = newOrder;
  return resource;
}