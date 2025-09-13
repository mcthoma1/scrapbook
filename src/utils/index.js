export function createPageUrl(name) {
  const [pageName, query] = name.split('?');
  const routes = {
    Home: '/',
    Albums: '/albums',
    AlbumDetail: '/album',
    CreateMemory: '/memories/create',
    EditMemory: '/memories/edit',
    Profile: '/profile',
  };
  const base = routes[pageName] || '/';
  return query ? `${base}?${query}` : base;
}

export default createPageUrl;
