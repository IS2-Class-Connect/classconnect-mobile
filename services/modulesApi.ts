import {
  getFromGateway,
  postToGateway,
  patchToGateway,
  deleteFromGateway,
} from './gatewayClient';

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
  dataType: 'IMAGE' | 'VIDEO' | 'LINK';
  module_id: string;
  order: number;
};

// === MODULES ===

export async function createModule(
  data: Pick<Module, 'title' | 'description' | 'order'>,
  courseId: number,
  token: string,
  userId: string
): Promise<Module> {
  const payload = {
    ...data,
    userId,
  };
  console.log('Creating module with payload:', payload);
  const response = await postToGateway(`/courses/${courseId}/modules`, payload, token);
  return {
    ...response.data,
    id_course: courseId,
    resources: [],
  };
}

export async function deleteModule(
  id: string,
  courseId: number,
  userId: string,
  token: string
): Promise<void> {
  await deleteFromGateway(`/courses/${courseId}/modules/${id}?userId=${userId}`, token);
}

export async function patchModule(
  id: string,
  courseId: number,
  data: Partial<Pick<Module, 'title' | 'description' | 'order'>>,
  token: string,
  userId: string
): Promise<Module> {
  const payload = {
    ...data,
    userId,
  };
  const response = await patchToGateway(`/courses/${courseId}/modules/${id}`, payload, token);
  return {
    ...response.data,
    id_course: courseId,
    resources: [],
  };
}

export async function getModulesByCourse(
  courseId: number,
  token: string
): Promise<Module[]> {
  const response = await getFromGateway(`/courses/${courseId}/modules`, token);
  return (response.data as any[]).map((m) => ({
    id: m.id,
    title: m.title,
    description: m.description,
    order: m.order,
    id_course: courseId,
    resources: [],
  }));
}

// === RESOURCES ===

export async function addResource(
  moduleId: string,
  courseId: number,
  resource: Omit<ModuleResource, 'module_id'>,
  token: string,
  userId: string
): Promise<ModuleResource> {
  const payload = {
    link: resource.link,
    dataType: resource.dataType, 
    order: resource.order,
    userId,
  };
  console.log('Adding resource with payload:', payload);
  const response = await postToGateway(`/courses/${courseId}/modules/${moduleId}/resources`, payload, token);
  return {
    ...response.data,
    module_id: moduleId,
  };
}

export async function deleteResource(
  moduleId: string,
  courseId: number,
  link: string,
  userId: string,
  token: string
): Promise<void> {
  await deleteFromGateway(
    `/courses/${courseId}/modules/${moduleId}/resources/${encodeURIComponent(link)}?userId=${userId}`,
    token
  );
}

export async function patchResourceOrder(
  moduleId: string,
  courseId: number,
  link: string,
  newOrder: number,
  userId: string,
  token: string
): Promise<ModuleResource> {
  const payload = {
    order: newOrder,
    userId,
  };
  const response = await patchToGateway(
    `/courses/${courseId}/modules/${moduleId}/resources/${encodeURIComponent(link)}`,
    payload,
    token
  );
  return {
    ...response.data,
    module_id: moduleId,
  };
}

export async function getResourcesByModule(
  moduleId: string,
  courseId: number,
  token: string
): Promise<ModuleResource[]> {
  const response = await getFromGateway(`/courses/${courseId}/modules/${moduleId}/resources`, token);
  return (response.data as any[]).map((r) => ({
    link: r.link,
    dataType: r.dataType,
    order: r.order,
    module_id: moduleId,
  }));
}
