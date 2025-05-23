export function readJsonFile(file: File): Promise<object> {
  return new Promise((resolve, reject) => {
    const fileReader = new FileReader();
    fileReader.onload = () => {
      const result = fileReader.result;
      if (typeof result === 'string') {
        resolve(JSON.parse(result));
      } else {
        reject(new Error('invalid_file'));
      }
    };
    fileReader.onerror = reject;
    fileReader.readAsText(file);
  });
}
