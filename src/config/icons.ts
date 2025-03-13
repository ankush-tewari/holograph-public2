import { FiBox, FiHome, FiFileText } from "react-icons/fi"; // Feather Icons
import { MdInventory, MdAccountBalance, MdHealthAndSafety, MdRealEstateAgent } from "react-icons/md"; // Material Icons
import { FaUserShield, FaCar, FaWifi, FaGift, FaUserFriends, FaBox } from "react-icons/fa"; // FontAwesome
import { AiFillCreditCard, AiOutlineShoppingCart } from "react-icons/ai"; // Ant Design Icons
import { GiOpenTreasureChest, GiGemPendant } from "react-icons/gi"; // Game Icons for valuables

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
