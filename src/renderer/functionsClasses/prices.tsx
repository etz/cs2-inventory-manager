import { ItemRow } from 'renderer/interfaces/items';
import { Prices, Settings } from 'renderer/interfaces/states';
import { pricing_add_to_requested } from 'renderer/store/actions/pricingActions';

const MAX_SAFE_PRICE = 1e12;

function safePrice(value: number, nanToZero: boolean): number {
  if (value == null || typeof value !== 'number') return nanToZero ? 0 : NaN;
  if (Number.isNaN(value) || !Number.isFinite(value)) return nanToZero ? 0 : NaN;
  if (value < 0 || value > MAX_SAFE_PRICE) return nanToZero ? 0 : NaN;
  return value;
}

export class ConvertPrices {
  settingsData: Settings;
  prices: Prices;

  constructor(settingsData: Settings, prices: Prices) {
    this.settingsData = settingsData;
    this.prices = prices;
  }

  _getName(itemRow: ItemRow) {
    return itemRow.item_name + (itemRow.item_wear_name || '');
  }

  getPrice(itemRow: ItemRow, nanToZero = false) {
    const sourcePrice =
      this.prices.prices[this._getName(itemRow)]?.[
        this.settingsData.source.title
      ];
    const currencyMultiplier = this.settingsData.currencyPrice[this.settingsData.currency];
    const value =
      (typeof sourcePrice === 'number' ? sourcePrice : NaN) *
      (typeof currencyMultiplier === 'number' ? currencyMultiplier : NaN);
    return safePrice(value, nanToZero);
  }
}

export class ConvertPricesFormatted extends ConvertPrices {
  constructor(settingsData: Settings, prices: Prices) {
    super(settingsData, prices);
  }

  formatPrice(price: number) {
    const safe = safePrice(price, true);
    return new Intl.NumberFormat(this.settingsData.locale, {
      style: 'currency',
      currency: this.settingsData.currency,
    }).format(safe);
  }

  getFormattedPrice(itemRow: ItemRow) {
    return this.formatPrice(this.getPrice(itemRow, true));
  }

  getFormattedPriceCombined(itemRow: ItemRow) {
    const price = this.getPrice(itemRow, true);
    const comQty =
      typeof itemRow?.combined_QTY === 'number' &&
      Number.isFinite(itemRow.combined_QTY) &&
      itemRow.combined_QTY >= 0 &&
      itemRow.combined_QTY <= 1e7
        ? itemRow.combined_QTY
        : 1;
    const total = price * comQty;
    const clamped = safePrice(total, true);
    return new Intl.NumberFormat(this.settingsData.locale, {
      style: 'currency',
      currency: this.settingsData.currency,
    }).format(clamped);
  }
}

async function requestPrice(priceToGet: Array<ItemRow>) {
  window.electron.ipcRenderer.getPrice(priceToGet);
}

async function dispatchRequested(
  dispatch: Function,
  rowsToGet: Array<ItemRow>
) {
  dispatch(pricing_add_to_requested(rowsToGet));
}

export class RequestPrices extends ConvertPrices {
  dispatch: Function;
  constructor(dispatch: Function, settingsData: Settings, prices: Prices) {
    super(settingsData, prices);
    this.dispatch = dispatch;
  }

  _checkRequested(itemRow: ItemRow): boolean {
    return (
      this.prices.productsRequested.includes(this._getName(itemRow)) == false
    );
  }

  handleRequested(itemRow: ItemRow): void {
    if (isNaN(this.getPrice(itemRow)) == true && this._checkRequested(itemRow)) {
      let rowsToSend = [itemRow];
      requestPrice(rowsToSend);
      dispatchRequested(this.dispatch, rowsToSend);
    }
  }

  handleRequestArray(itemRows: Array<ItemRow>): void {
    let rowsToSend = [] as Array<ItemRow>
    itemRows.forEach((itemRow) => {
      if (isNaN(this.getPrice(itemRow)) == true && this._checkRequested(itemRow)) {
        rowsToSend.push(itemRow)
      }
    });
    if (rowsToSend.length > 0) {
      requestPrice(rowsToSend);
      dispatchRequested(this.dispatch, rowsToSend);

    }
  }
}
