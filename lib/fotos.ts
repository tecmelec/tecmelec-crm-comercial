export async function firmarFotos(sb: any, acts: any[]) {
  const paths = acts.map((a) => a.foto_path).filter(Boolean);
  if (!paths.length) return {} as Record<string, string>;
  const { data } = await sb.storage.from("crm-fotos").createSignedUrls(paths, 3600);
  return Object.fromEntries((data ?? []).filter((d: any) => d.signedUrl).map((d: any) => [d.path, d.signedUrl]));
}
