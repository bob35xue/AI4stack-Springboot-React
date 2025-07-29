package com.example.chatbot.service;

import ai.djl.modality.Classifications;
import ai.djl.modality.nlp.bert.BertTokenizer;
import ai.djl.translate.Batchifier;
import ai.djl.translate.Translator;
import ai.djl.translate.TranslatorContext;
import ai.djl.ndarray.NDList;
import ai.djl.ndarray.NDArray;
import ai.djl.ndarray.NDManager;
import ai.djl.modality.nlp.DefaultVocabulary;
import com.example.chatbot.utils.LoggerUtil;
import org.slf4j.Logger;

import java.io.BufferedReader;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.util.List;
import java.util.stream.Collectors;

import com.example.chatbot.model.Product;
import com.example.chatbot.repository.ProductRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

@Component
public class MyTranslator implements Translator<String, Classifications> {

    private static final Logger logger = LoggerUtil.getLogger(MyTranslator.class);
    private DefaultVocabulary vocabulary;
    private BertTokenizer tokenizer;
    private List<String> productNames;

    @Autowired
    private ProductRepository productRepository;

    public MyTranslator() {
        try {
            InputStream is = getClass().getResourceAsStream("/vocab.txt");
            List<String> vocabList = new BufferedReader(new InputStreamReader(is)).lines().collect(Collectors.toList());
            vocabulary = DefaultVocabulary.builder()
                .add(vocabList)
                .optUnknownToken("[UNK]")
                .build();
            tokenizer = new BertTokenizer();
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }

    @Override
    public void prepare(TranslatorContext ctx) {
        productNames = productRepository.findAll().stream()
                .map(Product::getName)
                .collect(Collectors.toList());
    }

    @Override
    public NDList processInput(TranslatorContext ctx, String input) {
        NDManager manager = ctx.getNDManager();
        List<String> tokens = tokenizer.tokenize(input.toLowerCase());
        long[] indices = tokens.stream().mapToLong(vocabulary::getIndex).toArray();
        long[] attentionMask = new long[indices.length];
        java.util.Arrays.fill(attentionMask, 1);

        NDArray indicesArray = manager.create(indices);
        NDArray attentionMaskArray = manager.create(attentionMask);

        return new NDList(indicesArray, attentionMaskArray);
    }

    @Override
    public Classifications processOutput(TranslatorContext ctx, NDList list) {
        NDArray probabilities = list.get(0).softmax(0);
        return new Classifications(productNames, probabilities);
    }

    @Override
    public Batchifier getBatchifier() {
        return Batchifier.STACK;
    }
}