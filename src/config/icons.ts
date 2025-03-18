// /src/config/icons.ts

import { FiBox, FiHome, FiFileText, FiDelete } from "react-icons/fi"; // Feather Icons
import { MdInventory, MdAccountBalance, MdHealthAndSafety, MdRealEstateAgent, MdClose, MdAddCircle } from "react-icons/md"; // Material Icons
import { FaPlus, FaTimes, FaUserShield, FaCar, FaWifi, FaGift, FaUserFriends, FaBox } from "react-icons/fa"; // FontAwesome
import { AiFillCreditCard, AiOutlineShoppingCart } from "react-icons/ai"; // Ant Design Icons
import { GiOpenTreasureChest, GiGemPendant } from "react-icons/gi"; // Game Icons for valuables
import { FiUserPlus, FiUsers, FiEdit, FiTrash2, FiLink } from "react-icons/fi"; // Import these for user roles


export const sectionIcons = {
  "vital-documents": FiFileText, // Represents document storage
  "financial-accounts": MdAccountBalance, // Bank and financial-related items
  "insurance-accounts": MdHealthAndSafety, // Insurance-related data
  "properties": MdRealEstateAgent, // Represents real estate properties
  "personal-properties": MdInventory, // Represents valuables like heirlooms, jewelry, etc.
  "social-media": FaUserFriends, // Represents social connections
  "utilities": FaWifi, // Utilities like internet, electricity, etc.
  "subscriptions": AiOutlineShoppingCart, // Represents paid subscriptions
  "reward-programs": FaGift, // Rewards and loyalty programs
  "home-services": FiHome, // Home maintenance and related services
};

// ✅ Standardized button icons
export const buttonIcons = {
  create: FaPlus, // ✅ Create new items
  close: FaTimes, // ✅ Close modals
  add: MdAddCircle, // ✅ Alternative for create
  remove: MdClose, // ✅ Alternative for close
  link: FiLink, // link icon
  edit: FiEdit, // edit icon
  delete: FiTrash2, //delete icon
  users: FiUsers, //users icon
};

export const userIcons = {
  addPrincipal: FiUserPlus,
  addDelegate: FiUsers,
};