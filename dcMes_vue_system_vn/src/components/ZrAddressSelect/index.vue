<template>
    <div>
        <el-cascader :placeholder="isMultiple ? '选择多个国家和地区' : '选择国家和地区'" :options="countryOptions"
            :props="{ multiple: isMultiple, checkStrictly: checkStrictly }" filterable v-model="selectedValue"
            @change="handleChange"></el-cascader>
    </div>
</template>

<script>
import countryOptions from './countryOptions.json';
export default {
    props: {
        value: {
            type: Array,
            default: () => []
        },
        isMultiple: {
            type: Boolean,
            default: false // 默认单选
        },
        checkStrictly: {
            type: Boolean,
            default: false
        }
    },
    data() {
        return {
            countryOptions, // 引用国家地区数据
            selectedValue: this.value // 初始化选中值
        };
    },
    watch: {
        value(newValue) {
            this.selectedValue = newValue;
        },
        selectedValue(newValue) {
            this.$emit('input', newValue);
        }
    },
    methods: {
        handleChange(value) {
            this.$emit('change', value);
        }
    }
};
</script>