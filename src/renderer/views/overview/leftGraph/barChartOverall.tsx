import { Bar } from 'react-chartjs-2';
import { useSelector } from 'react-redux';
import Chart from 'chart.js/auto';
import { ReducerManager } from 'renderer/functionsClasses/reducerManager';
import { ItemRow } from 'renderer/interfaces/items';
import { searchFilter } from 'renderer/functionsClasses/filters/search';
import { Prices, Settings } from 'renderer/interfaces/states';
import {
  ConvertPrices,
  ConvertPricesFormatted,
} from 'renderer/functionsClasses/prices';
Chart;

function runArray(
  arrayToRun: Array<ItemRow>,
  objectToUse: any,
  by: string,
  PricingConverter
) {
  objectToUse = getObject(arrayToRun, objectToUse, by, PricingConverter);
  var items = Object.keys(objectToUse).map(function (key) {
    return [key, objectToUse[key]];
  });

  // Sort the array based on the second element
  items.sort(function (first, second) {
    return second[1] - first[1];
  });
  return items;
}

function getObject(
  arrayToRun: Array<ItemRow>,
  objectToUse: any,
  by: string,
  PricingConverter
) {
  arrayToRun = arrayToRun.filter((itemRow) => itemRow.item_moveable);

  arrayToRun.forEach((element) => {
    if (objectToUse[element.item_name] == undefined) {
      switch (by) {
        case 'price':
          objectToUse[element.item_name] =
            PricingConverter.getPrice(element, true) * element.combined_QTY;
          break;
        case 'volume':
          objectToUse[element.item_name] = element.combined_QTY;
          break;
        default:
          break;
      }
    } else {
      switch (by) {
        case 'price':
          objectToUse[element.item_name] =
            objectToUse[element.item_name] +
            PricingConverter.getPrice(element, true) * element.combined_QTY;
          break;
        case 'volume':
          objectToUse[element.item_name] =
            objectToUse[element.item_name] + element.combined_QTY;
          break;
        default:
          break;
      }
    }
  });
  return objectToUse;
}

export default function OverallVolume() {
  // Go through inventory and find matching categories
  let Reducer = new ReducerManager(useSelector);
  let settingsData: Settings = Reducer.getStorage(Reducer.names.settings);
  let pricingData: Prices = Reducer.getStorage(Reducer.names.pricing);
  let PricingConverter = new ConvertPrices(settingsData, pricingData);
  const inventory = Reducer.getStorage(Reducer.names.inventory);

  // Convert inventory to chart data

  let seenNamesOverall: any = {};
  let seenNamesInventory: any = {};
  let seenNamesStorage: any = {};

  const combined = Array.isArray(inventory.combinedInventory) && inventory.combinedInventory.length <= 500000 ? inventory.combinedInventory : [];
  const storage = Array.isArray(inventory.storageInventory) && inventory.storageInventory.length <= 500000 ? inventory.storageInventory : [];
  let inventoryFiltered = searchFilter(
    combined,
    Reducer.getStorage(Reducer.names.inventoryFilters),
    undefined
  );

  let storageFiltered = searchFilter(
    storage,
    Reducer.getStorage(Reducer.names.inventoryFilters),
    undefined
  );

  const invF = Array.isArray(inventoryFiltered) && inventoryFiltered.length <= 500000 ? inventoryFiltered : [];
  const storF = Array.isArray(storageFiltered) && storageFiltered.length <= 500000 ? storageFiltered : [];
  let overallData = runArray(
    [...invF, ...storF],
    seenNamesOverall,
    settingsData.overview.by,
    PricingConverter
  );
  let inventoryData = getObject(
    invF,
    seenNamesInventory,
    settingsData.overview.by,
    PricingConverter
  );
  let storageData = getObject(
    storF,
    seenNamesStorage,
    settingsData.overview.by,
    PricingConverter
  );
  const converter = new ConvertPricesFormatted(settingsData, pricingData);

  const maxBars = 20;
  const chartSlice = Array.isArray(overallData) ? overallData.slice(0, maxBars) : [];
  const safeNum = (v: unknown): number => (typeof v === 'number' && Number.isFinite(v) ? v : 0);
  const yMax = chartSlice.length
    ? Math.min(1e9, Math.max(1, ...chartSlice.map((row) => safeNum(inventoryData[row[0]]) + safeNum(storageData[row[0]]))))
    : 100;

  const title = (tooltipItems) => {
    if (settingsData.overview.by == 'price') {
      return tooltipItems.dataset.label + ': ' + converter.formatPrice(tooltipItems.raw);
    }
    return tooltipItems.dataset.label + ': ' + tooltipItems.raw;
  };

  const options = {
    plugins: {
      tooltip: {
        callbacks: {
          label: title,
        },
      },
      legend: {
        labels: {
          color: '#d6d3cd',
        },

        textDirection: 'ltr',
      },
      title: {
        display: true,
        text: 'Overall',
        color: '#d6d3cd',
      },
    },
    scales: {
      x: {
        stacked: true,
        ticks: {
          color: '#d6d3cd',
          maxRotation: 90,
          minRotation: 90,
          scaleStepWidth: 1,
        },
      },
      y: {
        stacked: true,
        min: 0,
        max: yMax,
        suggestedMax: yMax,
        ticks: {
          beginAtZero: true,
          maxTicksLimit: 11,
          callback: function (value) {
            if (value % 1 === 0) {
              return value;
            }
          },
        },
      },
    },
  };

  const data = {
    labels: chartSlice.map((itemRow) => String(itemRow[0] ?? '').slice(0, 40)),

    datasets: [
      {
        label: 'Inventory',
        data: chartSlice.map((itemRow) => safeNum(inventoryData[itemRow[0]])),
        backgroundColor: 'rgba(255, 99, 132, 0.2)',
        borderColor: 'rgba(255, 99, 132, 1)',
        borderWidth: 1,
      },
      {
        label: 'Storage Units',
        data: chartSlice.map((itemRow) => safeNum(storageData[itemRow[0]])),
        backgroundColor: 'rgb(50, 91, 136, 0.2)',
        borderColor: 'rgb(50, 91, 136, 1)',
        borderWidth: 1,
      },
    ],
  };
  // @ts-ignore
  return (
    <>
      <Bar data={data} width="518" height="400" options={options} />
    </>
  );
}
