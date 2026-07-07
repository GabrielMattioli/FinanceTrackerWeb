export const checkError = (error: any, data: any) => {
  if (error) throw error;
  return data;
};
