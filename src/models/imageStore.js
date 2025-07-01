const images = [];

export const addImage = (img) => images.push(img);

export const getImages = (page, limit) => {
  const offset = (page - 1) * limit;
  return {
    data: images.slice(offset, offset + limit),
    total: images.length,
  };
};
