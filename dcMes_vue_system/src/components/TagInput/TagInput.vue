<template>
    <div>
        <el-tag
            :key="tag"
            v-for="tag in tags"
            closable
            :disable-transitions="false"
            @close="removeTag(tag)"
        >
            {{ tag }}
        </el-tag>
        <el-input
            class="input-new-tag"
            v-if="inputVisible"
            v-model="inputValue"
            ref="saveTagInput"
            size="small"
            @keyup.enter.native="handleInputConfirm"
            @blur="handleInputConfirm"
        >
        </el-input>
        <el-button
            v-else
            class="button-new-tag"
            size="small"
            @click="showInput"
        >
            + New Tag
        </el-button>
    </div>
</template>

<script>
export default {
    props: {
        value: {
            type: Array,
            default: () => []
        }
    },
    data() {
        return {
            inputVisible: false,
            inputValue: ''
        };
    },
    computed: {
        tags() {
            return this.value;
        }
    },
    methods: {
        removeTag(tag) {
            this.$emit('input', this.tags.filter(t => t !== tag));
        },
        showInput() {
            this.inputVisible = true;
            this.$nextTick(() => {
                this.$refs.saveTagInput.$refs.input.focus();
            });
        },
        handleInputConfirm() {
            if (this.inputValue) {
                this.$emit('input', [...this.tags, this.inputValue]);
            }
            this.inputVisible = false;
            this.inputValue = '';
        }
    }
};
</script>

<style scoped>
.input-new-tag {
    width: 100px;
    margin-right: 10px;
}
.button-new-tag {
    margin-top: 5px;
}
</style> 