import type { ImageSourcePropType } from 'react-native';

export const icons: Record<'home' | 'products' | 'categories' | 'messages' | 'settings' | 'contact' | 'menu' | 'filter' | 'chevron', ImageSourcePropType> = {
  home: require('../../assets/icons/home.png'),
  products: require('../../assets/icons/products.png'),
  categories: require('../../assets/icons/categories.png'),
  messages: require('../../assets/icons/messages.png'),
  settings: require('../../assets/icons/settings.png'),
  contact: require('../../assets/icons/contact.png'),
  menu: require('../../assets/icons/menu.png'),
  filter: require('../../assets/icons/filter.png'),
  chevron: require('../../assets/icons/chevron.png'),
};
