<template>
  <div class="container mx-auto flex flex-col items-center bg-gray-100 p-4">
    <div
      v-if="false"
      class="fixed w-100 h-100 opacity-80 bg-purple-800 inset-0 z-50 flex items-center justify-center"
    >
      <svg
        class="animate-spin -ml-1 mr-3 h-12 w-12 text-white"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle
          class="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          stroke-width="4"
        ></circle>
        <path
          class="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        ></path>
      </svg>
    </div>
    <div class="container">
      <add-ticker @add-ticker="addTicker" :disabled="tooManyTickersAdd" />
      <template v-if="tickers.length > 0">
        <div>
          <button
            v-if="page > 1"
            @click="page = page - 1"
            type="button"
            class="my-4 mr-2 inline-flex items-center py-2 px-4 border border-transparent shadow-sm text-sm leading-4 font-medium rounded-full text-white bg-gray-600 hover:bg-gray-700 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
          >
            Назад
          </button>
          <button
            v-if="hasNextPage"
            @click="page = page + 1"
            type="button"
            class="my-4 inline-flex items-center py-2 px-4 border border-transparent shadow-sm text-sm leading-4 font-medium rounded-full text-white bg-gray-600 hover:bg-gray-700 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
          >
            Вперед
          </button>
        </div>
        <div>
          <p>
            <label
              for="filter"
              class="inline-block mr-1 text-sm font-medium text-gray-700"
              >Фильтр:</label
            >
            <input
              v-model="filter"
              type="text"
              id="filter"
              name="filter"
              class="pr-10 border-gray-300 text-gray-900 focus:outline-none focus:ring-gray-500 focus:border-gray-500 sm:text-sm rounded-md"
              placeholder=""
            />
          </p>
        </div>
        <hr class="w-full border-t border-gray-600 my-4" />
        <dl class="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-3">
          <div
            v-for="t in paginatedTickers"
            @click="select(t)"
            :key="t.name"
            class="bg-white overflow-hidden shadow rounded-lg border-purple-800 border-solid cursor-pointer"
            :class="{ 'border-4': selectedTicker === t }"
          >
            <div class="px-4 py-5 sm:p-6 text-center">
              <dt class="text-sm font-medium text-gray-500 truncate">
                {{ t.name }} - USD
              </dt>
              <dd class="mt-1 text-3xl font-semibold text-gray-900">
                {{ formatPrice(t.price) }}
              </dd>
            </div>
            <div class="w-full border-t border-gray-200"></div>
            <button
              @click.stop="deleteTicker(t)"
              class="flex items-center justify-center font-medium w-full bg-gray-100 px-4 py-4 sm:px-6 text-md text-gray-500 hover:text-gray-600 hover:bg-gray-200 hover:opacity-20 transition-all focus:outline-none"
            >
              <svg
                class="h-5 w-5"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="#718096"
                aria-hidden="true"
              >
                <path
                  fill-rule="evenodd"
                  d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                  clip-rule="evenodd"
                ></path></svg
              >Удалить
            </button>
          </div>
        </dl>
        <hr class="w-full border-t border-gray-600 my-4" />
      </template>
      <graph-ticker
        v-if="selectedTicker"
        @click="closeTicker"
        @calculatedMaxGraphElements="calculatedMaxGraphElements"
        :ticker="selectedTicker"
        :graph="graph"
      />
    </div>
  </div>
</template>

<script>
import { subscribeToTicker, unsubscribeFromTicker } from "@/api";
import AddTicker from "@/components/AddTicker";
import GraphTicker from "@/components/GraphTicker";

export default {
  name: "App",
  components: { GraphTicker, AddTicker },
  data() {
    return {
      tickers: [],
      selectedTicker: null,
      graph: [],
      filter: "",
      page: 1,
      maxGraphElements: 1,
    };
  },
  emits: ["close-ticker", "calculated-max-graph-elements"],
  created() {
    const windowData = Object.fromEntries(
      new URL(window.location).searchParams.entries()
    );
    const VALID_KEYS = ["filter", "page"];
    VALID_KEYS.forEach((key) => {
      if (windowData[key]) {
        this[key] = windowData[key];
      }
    });
    if (windowData.filter) {
      this.filter = windowData.filter;
    }
    if (windowData.page) {
      this.page = windowData.page;
    }
    const tickersData = localStorage.getItem("tickers-list");
    if (tickersData) {
      this.tickers = JSON.parse(tickersData);
      this.tickers.forEach((ticker) => {
        subscribeToTicker(ticker.name, (newPrice) =>
          this.updateTicker(ticker.name, newPrice)
        );
      });
    }
    setInterval(this.updateTickers, 3000);
  },
  computed: {
    tooManyTickersAdd() {
      return this.tickers.length > 4;
    },
    startIndex() {
      return (this.page - 1) * 6;
    },
    endIndex() {
      return this.page * 6;
    },
    filteredTickers() {
      return this.tickers.filter((ticker) =>
        ticker.name.toLowerCase().includes(this.filter.toLowerCase())
      );
    },
    paginatedTickers() {
      return this.filteredTickers.slice(this.startIndex, this.endIndex);
    },
    hasNextPage() {
      return this.filteredTickers.length > this.endIndex;
    },
    pageStateOption() {
      return {
        filter: this.filter,
        page: this.page,
      };
    },
  },
  methods: {
    calculatedMaxGraphElements(width) {
      if (!width) {
        return;
      }
      this.maxGraphElements = width / 40;
    },
    closeTicker() {
      this.$emit("close-ticker");
      this.selectedTicker = null;
    },
    updateTicker(tickerName, price) {
      this.tickers
        .filter((t) => t.name === tickerName)
        .forEach((t) => {
          if (t === this.selectedTicker) {
            this.graph.push(price);
            this.graph = this.graph.slice(-this.maxGraphElements);
          }
          t.price = price;
        });
    },
    formatPrice(price) {
      if (price === "-") {
        return price;
      }
      return price > 1 ? price.toFixed(2) : price.toPrecision(2);
    },
    addTicker(ticker) {
      const newTicker = {
        name: ticker,
        price: "-",
      };
      this.tickers = [...this.tickers, newTicker];
      subscribeToTicker(newTicker.name, (newPrice) =>
        this.updateTicker(newTicker.name, newPrice)
      );
      this.filter = "";
    },
    select(ticker) {
      this.selectedTicker = ticker;
    },
    deleteTicker(tickerDelete) {
      this.tickers = this.tickers.filter((t) => t !== tickerDelete);
      if (this.selectedTicker === tickerDelete) {
        this.selectedTicker = null;
      }
      unsubscribeFromTicker(tickerDelete.name);
    },
  },
  watch: {
    selectedTicker() {
      this.graph = [];
    },
    paginatedTickers() {
      if (this.paginatedTickers.length === 0 && this.page > 1) {
        this.page -= 1;
      }
    },
    tickers() {
      localStorage.setItem("tickers-list", JSON.stringify(this.tickers));
    },
    filter() {
      this.page = 1;
    },
    pageStateOption(value) {
      window.history.pushState(
        null,
        document.title,
        `${window.location.pathname}?filter=${value.filter}&page=${value.page}`
      );
    },
  },
};
</script>
