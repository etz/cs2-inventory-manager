
import { Inventory } from "renderer/interfaces/states";

const initialState: Inventory = {
  inventory: [],
  combinedInventory: [],
  storageInventory: [],
  storageInventoryRaw: [],
  totalAccountItems: 0,
  itemsLookUp: {}
};

const inventoryReducer = (state = initialState, action) => {
  switch (action.type) {
    case 'INVENTORY_SET_INVENTORY': {
      if (!action.payload) return state;
      try {
        const rawInv = action.payload.inventory;
        const rawCombined = action.payload.combinedInventory;
        const safeLen = (n: number) => Number.isFinite(n) && n >= 0 && n <= 500000;
        const inventory = Array.isArray(rawInv) && safeLen(rawInv.length) ? rawInv : [];
        const combinedInventory = Array.isArray(rawCombined) && safeLen(rawCombined.length) ? rawCombined : [];
        let storageTotal = 0;
        const safeMaxTotal = 10 * 1000 * 1000;
        for (let i = 0; i < inventory.length; i++) {
          const element = inventory[i];
          storageTotal += 1;
          if (element?.item_url === 'econ/tools/casket' && element?.item_storage_total != null) {
            const add = Number(element.item_storage_total);
            storageTotal += (Number.isFinite(add) && add >= 0 && add <= 1000) ? add : 0;
          }
        }
        const totalAccountItems = Math.max(0, Math.min(storageTotal, safeMaxTotal));
        return {
          ...state,
          inventory,
          combinedInventory,
          totalAccountItems
        };
      } catch (e) {
        return state;
      }
    }
    case 'INVENTORY_STORAGES_ADD_TO':
      console.log(state)
      const add_to_filtered = state.storageInventory?.filter(id => id.storage_id != action.payload.casketID) || []
      const add_to_filtered_raw = state.storageInventoryRaw?.filter(id => id.storage_id != action.pay) || []
      action.payload.storageData.forEach(storageRow => add_to_filtered.push(storageRow))
      action.payload.storageRowsRaw.forEach(storageRow => add_to_filtered_raw.push(storageRow))

      return {
        ...state,
        storageInventory: add_to_filtered,
        storageInventoryRaw: add_to_filtered_raw
      }
    case 'INVENTORY_STORAGES_CLEAR_CASKET':
      const AddToFiltered = state.storageInventory.filter(id => id.storage_id != action.payload.casketID)
      const AddToFilteredRaw = state.storageInventoryRaw.filter(id => id.storage_id != action.payload.casketID)

      return {
        ...state,
        storageInventory: AddToFiltered,
        storageInventoryRaw: AddToFilteredRaw
      }
    case 'INVENTORY_STORAGES_SET_SORT_STORAGES':
      return {
        ...state,
        storageInventory: action.payload.storageData
      }
    case 'INVENTORY_STORAGES_CLEAR_ALL':
      return {
        ...state,
        storageInventory: initialState.storageInventory,
        storageInventoryRaw: initialState.storageInventoryRaw
      }
    case 'MOVE_FROM_CLEAR':
      return {
        ...state
      }
    case 'MOVE_FROM_RESET':
      return {
        ...state,
        storageInventory: initialState.storageInventory,
        storageInventoryRaw: initialState.storageInventoryRaw

      }
    case 'SIGN_OUT':
      return {
        ...initialState
      }
    default:
      return { ...state }

  }
};

export default inventoryReducer;
